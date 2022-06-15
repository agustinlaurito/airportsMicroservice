module.exports = {
    port: 3001,
    connOpts: {
        defaultTimeout: 20000
    },
    operators: {
        eq: ':',
        gt: '>',
        lt: '<',
        gte: '>=',
        lte: '<=',
        ne: '!=',
        in: 'in',
        nin: 'nin',
        like: 'like',
        nlike: 'nlike',
    }
};
