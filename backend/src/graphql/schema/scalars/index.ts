import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

export const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'DateTime custom scalar type',
    serialize(value) {
        return value instanceof Date ? value.toISOString() : null;
    },
    parseValue(value: unknown) {
        if (typeof value === 'string') {
            return new Date(value);
        }
        throw new Error('GraphQL DateTime Scalar parser expected a string');
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});
