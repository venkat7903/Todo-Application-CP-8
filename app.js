const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodoQuery = "";

  switch (true) {
    case priority !== undefined && status !== undefined:
      getTodoQuery = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}'
        ;
    `;
      break;
    case priority !== undefined:
      getTodoQuery = `
          SELECT * FROM todo 
            WHERE todo LIKE '%${search_q}%' AND priority='${priority}';
          `;
      break;
    case status !== undefined:
      getTodoQuery = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%' AND status='${status}';
          `;
      break;
    default:
      getTodoQuery = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%';
        `;
  }

  const todoList = await db.all(getTodoQuery);
  response.send(todoList);
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT * FROM todo WHERE id=${todoId};
  `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodoQuery = `
  INSERT INTO todo (id, todo, priority, status)
  VALUES (${id}, '${todo}', '${priority}', '${status}');
  `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
  }

  const getPreviousTodo = `
  SELECT * FROM todo WHERE id=${todoId};
  `;
  const previousTodo = await db.get(getPreviousTodo);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = requestBody;

  const updateTodoQuery = `
  UPDATE todo
  SET 
    todo='${todo}',
    status='${status}',
    priority='${priority}'
  WHERE 
    id=${todoId};
  `;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//API5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
