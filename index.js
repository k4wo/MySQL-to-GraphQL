#!/usr/bin/env node
const mysql = require('mysql2/promise')
const yargs = require('yargs')


const argv = yargs
  .usage('Generate GraphQL schema from MySQL database')
  .demand('user')
  .alias('user', 'u')
  .describe('u', 'MySQL user')
  .demand('password')
  .alias('password', 'p')
  .describe('password', 'MySQL password')
  .demand('database')
  .alias('database', 'd')
  .describe('database', 'MySQL database')
  .default('host', 'localhost')
  .alias('host', 'h')
  .describe('host', 'MySQL host')
  .default('port', 3306)
  .alias('port', 'o')
  .describe('port', 'MySQL port')
  .argv

const querySchemaInfo = `
  SELECT *
  FROM information_schema.columns 
  WHERE table_schema = ?;
`
const queryForeignKeys = `
  SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE CONSTRAINT_SCHEMA = 'tapcar' 
    AND REFERENCED_TABLE_SCHEMA IS NOT NULL 
    AND REFERENCED_TABLE_NAME IS NOT NULL 
    AND REFERENCED_COLUMN_NAME IS NOT NULL
`

const SPECIAL_TYPES = new Set()

const capitalize = s => `${s.charAt(0).toUpperCase()}${s.slice(1)}`

const getType = ({ DATA_TYPE }) => {

  switch (DATA_TYPE) {
    case 'decimal':
    case 'numeric':
    case 'float':
    case 'double':
      return 'Float'

    case 'integer':
    case 'smallint':
    case 'tinyint':
    case 'mediumint':
    case 'bigint':
    case 'int':
    case 'bit':
      return 'Int'

    case 'json':
      return 'JSON'

    case 'geometry':
    case 'point':
      SPECIAL_TYPES.add('point')
      return 'Point'

    default:
      return 'String'
  }
}

const createSchema = (data, foreignKeys) => data.reduce((store, item) => {
  const {
    COLUMN_NAME: column,
    TABLE_NAME: table,
    IS_NULLABLE: isNull
  } = item
  const fk = findForeignKey(foreignKeys, table, column)
  const type = fk || getType(item)
  const isNullable = isNull === 'YES'

  const schema = Object.assign(
    {}, store[table], { [column]: `${type}${isNullable ? '' : '!'}` })

  return Object.assign({}, store, { [table]: schema })
}, {})

const findForeignKey = (foreingKeys, table, column) => {
  const fk = foreingKeys.find(item =>
    item.TABLE_NAME === table && item.COLUMN_NAME === column)

  const type = fk
    ? fk.REFERENCED_TABLE_NAME
    : ''
  return capitalize(type)
}

const convertToString = schema => {
  const propsToString = props => Object.keys(props).reduce((s, key) =>
    `${s}  ${key}: ${props[key]}\n`, '')

  return Object.keys(schema).reduce((s, key) =>
    `${s}\ntype ${capitalize(key)} {\n${propsToString(schema[key])}}\n`, '')
}

const addSpecialTypes = () => {

  return `type Point {\n  x: Float!\n  y: Float!\n}`
}

const run = async argv => {
  const { database, password, user, port, host } = argv

  try {
    const db = await mysql.createConnection({ database, password, user, port, host })
    const [details] = await db.execute(querySchemaInfo, [database])
    const [foreignKeys] = await db.query(queryForeignKeys)

    const schema = createSchema(details, foreignKeys)
    const graphqlSchema = convertToString(schema)
    const specialTypeSchema = SPECIAL_TYPES.size
      ? addSpecialTypes()
      : ''

    console.log(`${graphqlSchema}\n${specialTypeSchema}`)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }


  process.exit(0)
}

run(argv)
