export const productSchema = {
    type: 'object', required: ['id', 'name', 'price'],
    properties: { id: { type: 'number' }, name: { type: 'string' }, price: { type: 'number' } },
};
export const tokenSchema = { type: 'object', required: ['token'], properties: { token: { type: 'string' } } };
export const productsSchema = { type: 'array', items: productSchema };
