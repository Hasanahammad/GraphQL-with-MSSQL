// const express = require('express');
// const app = express();

// app.listen(3000, () => {
//     console.log("Server running on port 3000");
// });

// app.get("/msg", (req, res, next) => {
//     res.json({ "message": "Hello, World!" });
// });

// app.post("/msg", (req, res, next) => {
//     const newMessage = new Message(req.body.message);
//     res.json({ "receivedMessage": newMessage.getContent() });
// });


const { ApolloServer, gql } = require('apollo-server');
const sql = require('mssql');

// Define your GraphQL schema
const typeDefs = gql`
  type Query {
    stats: Result!
  }

  type Result {
    xitem: Int!
    nureqcount: Int!
    phdeliveredcount: Int!
    dornum: Int!
    tornum: Int!
    xavlitem: Int!
  }
`;

// Define your resolvers
const resolvers = {
    Query: {
        stats: async () => {
            try {
                const config = {
                    user: 'sa',
                    password: ' ',
                    server: 'localhost',
                    database: ' ',
                    options: {
                        encrypt: false,
                    },
                };

                const result = await executeQueries(config);
                return result;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
    },
};

async function executeQueries(config) {
    try {
        await sql.connect(config);

        // Query 1
        const query1 = `
      SELECT SUM(CASE WHEN zactive = 1 THEN 1 ELSE 0 END) AS xitem
      FROM caitem
      WHERE zid = '400010' AND xgitem = '1031'
    `;
        const result1 = await sql.query(query1);
        const xitem = result1.recordset[0].xitem;

        // Query 2
        const query2 = `
      SELECT COUNT(xreqnum) AS nureqcount
      FROM opipdpcreqheader WITH (NOLOCK)
      WHERE zid = '400010'
        AND xstatusreq NOT IN ('', 'Cancel')
        AND CONVERT(DATE, ztime) = CONVERT(DATE, GETDATE())
    `;
        const result2 = await sql.query(query2);
        const nureqcount = result2.recordset[0].nureqcount;

        // Query 3
        const query3 = `
      SELECT COUNT(xdocnum) AS phdeliveredcount
      FROM opipddoreqheader WITH (NOLOCK)
      WHERE zid = '400010'
        AND xstatusreq = 'Confirmed'
        AND CONVERT(DATE, ztime) = CONVERT(DATE, GETDATE())
    `;
        const result3 = await sql.query(query3);
        const phdeliveredcount = result3.recordset[0].phdeliveredcount;

        // Query 4
        const query4 = `
      SELECT COUNT(DISTINCT d.xdornum) AS dornum
      FROM opdoheaderdashview h
      JOIN opdodetailipdorderrptview d ON h.zid = d.zid AND h.xdornum = d.xdornum
      LEFT JOIN mmpatient m ON h.zid = m.zid AND h.xpatient = m.xpatient
      LEFT JOIN mmadmission a ON h.zid = a.zid AND h.xcase = a.xadmissionno
      WHERE d.xsign < 0 AND h.xepisodetype = 'IPD' AND CONVERT(DATE, d.xdate) = CONVERT(DATE, GETDATE())
    `;
        const result4 = await sql.query(query4);
        const dornum = result4.recordset[0].dornum;

        // Query 5
        const query5 = `
      SELECT COUNT(DISTINCT xtornum) AS tornum
      FROM imtorheader
      WHERE xtwh = 'SS033' AND CONVERT(DATE, xdate) = CONVERT(DATE, GETDATE())
    `;
        const result5 = await sql.query(query5);
        const tornum = result5.recordset[0].tornum;

        // Query 6
        const query6 = `
      SELECT COUNT(xitem) AS xavlitem
      FROM imstockbatchviewsum
      WHERE xwh = 'SS033' AND xdateexp BETWEEN GETDATE() AND DATEADD(DAY, 90, GETDATE())
    `;
        const result6 = await sql.query(query6);
        const xavlitem = result6.recordset[0].xavlitem;

        return {
            xitem,
            nureqcount,
            phdeliveredcount,
            dornum,
            tornum,
            xavlitem,
        };
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        await sql.close();
    }
}

// Create the GraphQL server
const server = new ApolloServer({ typeDefs, resolvers });
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});