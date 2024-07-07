// const { ApolloServer, gql } = require('apollo-server');

// const typeDefs = gql`
//   type Query {
//     greeting: String
//   }
// `;

// const resolvers = {
//     Query: {
//         greeting: () => 'Hello GraphQL world!👋'
//     },
// };

// const server = new ApolloServer({ typeDefs, resolvers });
// server
//     .listen({ port: 9000 })
//     .then(({ url }) => console.log(`Server running at ${url}`));
// const { makeExecutableSchema } = require('@graphql-tools/schema');


const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const db = require('./db');

const port = process.env.PORT || 9000;
const app = express();

const fs = require('fs');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { graphqlHTTP } = require('express-graphql'); // Updated import

const typeDefs = fs.readFileSync('./schema.graphql', { encoding: 'utf-8' });
const resolvers = require('./resolvers');

const schema = makeExecutableSchema({ typeDefs, resolvers });

app.use(cors(), bodyParser.json());

// Updated middleware for GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true // Enable GraphiQL
}));

app.listen(
    port, () => console.info(
        `Server started on port ${port}`
    )
);
