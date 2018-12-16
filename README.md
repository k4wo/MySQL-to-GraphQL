Convert MySQL database schema to GraphQL schema. At this moment MySQL 8 is not supported.

```
Generate GraphQL schema from MySQL database

Options:
  --help          Show help                    [boolean]
  --version       Show version number          [boolean]
  --password, -p  MySQL password               [required]
  --database, -d  MySQL database               [required]
  --host, -h      MySQL host                   [default: "localhost"]
  --port, -o      MySQL port                   [default: 3306]
  --user, -u      MySQL user                   [required]
```

## How to use
```
./node index.js \
-u `user name` \
-p `password` \
-d `database name` \
-o `port [optional]` \
-h `hostname [optional]`
```
`Optional` parameters can be omitted. They should be used when `port` or `host` is other than default.

You can easily save it to a file. Just append at the end of run command `>> 'file_name'`

## Output
Will depend on your DB schema but here is an example:
```
type Users {
  id: Int!
  email: String!
  firstName: String!
  lastName: String!
  password: String!
  mobilePhone: Int!
  insurace: String
  isActive: Int
  coordinates: Point
}

type Point {
  x: Float!
  y: Float!
}
```
