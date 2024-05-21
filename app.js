const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializingDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (error) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializingDbServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasStatusProperties = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasCategoryProperties = requestQuery => {
  return requestQuery.category !== undefined
}

const isValidTodoPriority = item => {
  if (item === 'HIGH' || item === 'MEDIUM' || item === 'LOW') {
    return true
  } else {
    return false
  }
}

const isValidTodoStatus = item => {
  if (item === 'TO DO' || item === 'IN PROGRESS' || item === 'DONE') {
    return true
  } else {
    return false
  }
}

const isValidTodoCategory = item => {
  if (item === 'WORK' || item === 'HOME' || item === 'LEARNING') {
    return true
  } else {
    return false
  }
}

const isValidTodoDueDate = item => {
  return isValid(new Date(item))
}

const convertDueDate = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.dueDate,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
    SELECT 
    *
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}'
    AND category = '${category}';
    `
      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(each => convertDueDate(each)))
      } else if (isValidTodoPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';
      `
      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';
      `
      if (isValidTodoCategory(category) && isValidTodoPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriorityProperties(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';
      `
      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperties(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';
      `
      if (isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    default:
      getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%';`
      data = await db.all(getTodoQuery)
      response.send(data.map(object => convertDueDate(object)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT 
  *
  FROM
  todo
  WHERE
  id = ${todoId}
  `
  const todo = await db.get(getTodoQuery)
  response.send(convertDueDate(todo))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.params
  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidTodoDueDate(date)) {
      const formattedDate = format(new Date(date), 'yy-MM-dd')
      const getTodoQuery = `
      SELECT 
      *
      FROM
      todo
      WHERE
      due_date = ${formattedDate}
      `
      const todo = await db.all(getTodoQuery)
      response.send(todo.map(each => convertDueDate(each)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoDetails
  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidTodoStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isValidTodoCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isValidTodoDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const formattedDate = format(new Date(dueDate), 'yy-MM-dd')
      const addTodoQuery = `
      INSERT INTO
      todo (id, todo, priority, status, category, due_date)
      VALUES (
        '${id}',
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${formattedDate}'
      )
      `
      const dbResponse = await db.run(addTodoQuery)
      response.send('Todo Successfully Added')
      break
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoDetails = request.body
  const {todo, priority, status, dueDate, category} = todoDetails
  switch (true) {
    case hasStatusProperties(request.body):
      const updateTodoStatusQuery = `
      UPDATE
      todo
      SET
      status = '${status}'
      WHERE
      id = ${todoId}
      `
      if (isValidTodoStatus(status)) {
        await db.run(updateTodoStatusQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriorityProperties(request.body):
      const updateTodoPriorityQuery = `
      UPDATE
      todo
      SET
      priority = '${priority}'
      WHERE
      id = ${todoId}
      `
      if (isValidTodoPriority(priority)) {
        await db.run(updateTodoPriorityQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryProperties(request.body):
      const updateTodoCategoryQuery = `
      UPDATE
      todo
      SET
      category = '${category}'
      WHERE
      id = ${todoId}
      `
      if (isValidTodoCategory(category)) {
        await db.run(updateTodoCategoryQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasDueDateProperties(request.body):
      const updateTodoDueDateQuery = `
      UPDATE
      todo
      SET
      due_date = '${dueDate}'
      WHERE
      id = ${todoId}
      `
      if (isValidTodoDueDate(dueDate)) {
        await db.run(updateTodoDueDateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      const updateTodoQuery = `
    UPDATE
    todo
    SET
    todo = '${todo}'
    WHERE
    id = ${todoId}
    `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE
  FROM
  todo
  WHERE
  id = ${todoId}
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
