#!/usr/bin/env python3
"""Validação funcional real; não executa experimentos de código/manutenção/reuso."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
SCENARIOS = [
    ('ct01', 'autenticacao/autenticacao', 1, ['login 200', 'token presente']),
    ('ct02', 'catalogo/catalogo', 3, ['login 200', 'token presente', 'lista 200', 'produtos disponíveis', 'produto 200', 'produto p1']),
    ('ct03', 'pedidos/criacao', 3, ['login 200', 'token presente', 'produto 200', 'produto p1', 'pedido 201', 'pedido criado']),
    ('ct04', 'pedidos/consulta', 3, ['login 200', 'token presente', 'pedido 201', 'pedido criado', 'consulta 200', 'pedido corresponde', 'status esperado']),
    ('ct05', 'pedidos/atualizacao', 4, ['login 200', 'token presente', 'pedido 201', 'pedido criado', 'atualização 200', 'status confirmado', 'consulta 200', 'pedido corresponde', 'status esperado']),
]


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def inventory():
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
            for folder in ('modular', 'tradicional', 'shared', 'api')
            for p in sorted((ROOT / folder).rglob('*.js'))}


def command(args, folder, name, timeout=30, env=None):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        result = subprocess.run(args, cwd=ROOT, env=env, capture_output=True, text=True, timeout=timeout)
        code, stdout, stderr = result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired as error:
        code = 124
        stdout = error.stdout or b''
        stderr = error.stderr or b''
        if isinstance(stdout, bytes): stdout = stdout.decode(errors='replace')
        if isinstance(stderr, bytes): stderr = stderr.decode(errors='replace')
        stderr += '\nTIMEOUT'
    except OSError as error:
        code, stdout, stderr = 127, '', str(error)
    record = dict(command=args, cwd=str(ROOT), started_utc=started, exit_code=code)
    write(folder / f'{name}.command.json', record)
    (folder / f'{name}.stdout.log').write_text(stdout)
    (folder / f'{name}.stderr.log').write_text(stderr)
    return record | dict(stdout=stdout, stderr=stderr)


def jsonlines(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()] if path.exists() else []


def client_requests(logs):
    requests = []
    for log in logs:
        message = log.get('msg', log.get('message', ''))
        if not message.startswith('Request:\n'): continue
        raw = message[len('Request:\n'):].replace('\r\n', '\n')
        head, _, body = raw.partition('\n\n')
        lines = head.splitlines()
        if not lines: continue
        method, path, protocol = lines[0].split(' ', 2)
        headers = {}
        for line in lines[1:]:
            key, _, value = line.partition(':')
            headers[key.lower()] = value.strip()
        requests.append(dict(sequence=len(requests)+1, method=method, path=path,
                             protocol=protocol, headers=headers, payload=body.rstrip('\n'),
                             request_id=log.get('request_id'), observation='client_attempt'))
    return requests


def canonical_requests(requests):
    return [dict(method=r['method'], path=r['path'], headers=r['headers'], payload=r['payload']) for r in requests]


def execute_suite(out, ct, journey, group, expected_requests, expected_checks, port):
    folder = out / f'{group}_{ct}'
    folder.mkdir()
    script = f'tradicional/{ct}.js' if group == 'tradicional' else f'modular/scenarios/{journey}.scenario.js'
    inspection = command(['k6', 'inspect', script], folder, 'inspect')
    try: options = json.loads(inspection['stdout'])
    except (json.JSONDecodeError, TypeError): options = {}
    if group == 'modular': effective = options.get('scenarios', {}).get(ct, {})
    else: effective = options
    profile_ok = effective.get('vus') == 1 and effective.get('iterations') == 1
    if group == 'modular': profile_ok = profile_ok and effective.get('executor') == 'shared-iterations'
    write(folder / 'effective-options.json', dict(vus=effective.get('vus'), iterations=effective.get('iterations'), valid=profile_ok))
    env = dict(os.environ, PORT=str(port), TRACE_FILE=str(folder / 'server-requests.jsonl'), READY_FILE=str(folder / 'api-ready.json'))
    api_args = ['node', 'scripts/validacao/api-observada.mjs']
    write(folder / 'api.command.json', dict(command=api_args, cwd=str(ROOT), environment={k: env[k] for k in ('PORT', 'TRACE_FILE', 'READY_FILE')}))
    api = None
    with (folder / 'api.stdout.log').open('w') as stdout, (folder / 'api.stderr.log').open('w') as stderr:
        try:
            api = subprocess.Popen(api_args, cwd=ROOT, env=env, stdout=stdout, stderr=stderr)
            deadline = time.monotonic() + 5
            while not (folder / 'api-ready.json').exists() and api.poll() is None and time.monotonic() < deadline:
                time.sleep(.05)
            ready = (folder / 'api-ready.json').exists() and api.poll() is None
            args = ['k6', 'run', '--no-usage-report', '--no-color', '--quiet', '--log-format=json',
                    '--log-output', f'file={folder / "http-debug.jsonl"}', '--http-debug=full',
                    '--summary-export', str(folder / 'summary.json'), '--out', f'json={folder / "metrics.jsonl"}',
                    '-e', f'BASE_URL=http://127.0.0.1:{port}', script]
            result = command(args, folder, 'k6-run', timeout=30)
        finally:
            if api is not None:
                if api.poll() is None:
                    api.terminate()
                    try: api.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        api.kill()
                        api.wait()
                write(folder / 'api-exit.json', dict(exit_code=api.returncode))
    metrics = jsonlines(folder / 'metrics.jsonl')
    points = [m for m in metrics if m.get('type') == 'Point']
    checks = [dict(name=m['data'].get('tags', {}).get('check'), value=m['data']['value'],
                   time=m['data'].get('time'), tags=m['data'].get('tags', {}))
              for m in points if m.get('metric') == 'checks']
    http_points = [m['data'] for m in points if m.get('metric') == 'http_reqs']
    iterations = sum(m['data']['value'] for m in points if m.get('metric') == 'iterations')
    received = jsonlines(folder / 'server-requests.jsonl')
    attempted = client_requests(jsonlines(folder / 'http-debug.jsonl'))
    write(folder / 'client-requests.json', attempted)
    write(folder / 'checks.json', checks)
    write(folder / 'http-request-metrics.json', http_points)
    check_ok = [c['name'] for c in checks] == expected_checks and all(c['value'] == 1 for c in checks)
    count_ok = len(received) == expected_requests and sum(m['value'] for m in http_points) == expected_requests
    real_success = ready and result['exit_code'] == 0 and profile_ok and count_ok and check_ok and iterations == 1
    record = dict(scenario=ct, suite=group, script=script, api_ready=ready, exit_code=result['exit_code'],
                  profile_valid=profile_ok, expected_requests=expected_requests, received_requests=len(received),
                  attempted_requests=len(attempted), http_reqs=sum(m['value'] for m in http_points),
                  iterations=iterations, expected_checks=len(expected_checks), observed_checks=len(checks),
                  passed_checks=sum(c['value'] == 1 for c in checks), real_success=real_success)
    write(folder / 'result.json', record)
    return record, received, checks


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=3333)
    args = parser.parse_args()
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S_%fZ')
    out = ROOT / 'evidencias' / 'validacao_final' / stamp
    out.mkdir(parents=True)
    before = inventory()
    modular_paths = [p for p in before if p.startswith('modular/')]
    write(out / 'source-manifest-before.json', before)
    accounting = dict(expected_file_count=24, actual_file_count=len(modular_paths),
                      included_in_modular_code_metrics=modular_paths,
                      http_helper_included='modular/helpers/http/http.js' in modular_paths,
                      checks_helper_included='modular/helpers/checks/checks.js' in modular_paths,
                      note='Inventário e hashes; nenhuma medição experimental de LOC, duplicação, manutenção ou reutilização executada.')
    write(out / 'code-accounting.json', accounting)
    tool_results = {}
    for name, cmd in [('node', ['node', '--version']), ('k6', ['k6', 'version']), ('python', ['python3', '--version']),
                      ('system', ['uname', '-a']), ('git', ['git', 'rev-parse', 'HEAD'])]:
        tool_results[name] = command(cmd, out, name)
    for name, cmd in [('http-helper', ['node', '--experimental-vm-modules', 'tests/http-helper.test.js']),
                      ('checks-helper', ['node', '--experimental-vm-modules', 'tests/checks-helper.test.js']),
                      ('api-test', ['node', 'api/server.test.js'])]:
        command(cmd, out, name)
    write(out / 'environment.json', dict(utc=stamp, platform=platform.platform(), tools=tool_results))
    pairs = []
    for ct, journey, request_count, check_names in SCENARIOS:
        runs = [execute_suite(out, ct, journey, group, request_count, check_names, args.port)
                for group in ('tradicional', 'modular')]
        success = all(r[0]['real_success'] for r in runs)
        requests_equal = canonical_requests(runs[0][1]) == canonical_requests(runs[1][1]) if success else None
        checks_equal = [(c['name'], c['value']) for c in runs[0][2]] == [(c['name'], c['value']) for c in runs[1][2]] if success else None
        statuses_equal = [r['status'] for r in runs[0][1]] == [r['status'] for r in runs[1][1]] if success else None
        pair = dict(scenario=ct, runs=[r[0] for r in runs], requests_equal=requests_equal,
                    checks_equal=checks_equal, response_statuses_equal=statuses_equal,
                    equivalent=success and requests_equal and checks_equal and statuses_equal)
        write(out / f'{ct}-comparison.json', pair)
        pairs.append(pair)
        print(f'{ct}: real_success={success}; equivalent={pair["equivalent"]}', flush=True)
    after = inventory()
    write(out / 'source-manifest-after.json', after)
    preserved = before == after and len(modular_paths) == 24
    complete = preserved and all(p['equivalent'] for p in pairs)
    write(out / 'result.json', dict(complete_functional_equivalence=complete, architecture_preserved=preserved,
                                   code_accounting=accounting, pairs=pairs))
    (ROOT / 'evidencias' / 'validacao_final' / 'ultima_execucao.txt').write_text(str(out.relative_to(ROOT))+'\n')
    print(f'EVIDENCIAS={out}', flush=True)
    raise SystemExit(0 if complete else 1)


if __name__ == '__main__':
    main()
