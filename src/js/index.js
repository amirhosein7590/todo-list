"use strict";

/**
 * elements.
 * elements that must get for diffrent tasks.
 */

const elements = {
  todoContainer: document.getElementById("todoContainer"),
  addBtn: document.querySelector(".add-button"),
  input: document.querySelector("input"),
  filtersElem: document.querySelector(".filters"),
  form: document.querySelector("form"),
  pdfBtn: document.querySelector(".pdf"),
  wordBtn: document.querySelector(".word"),
  excelBtn: document.querySelector(".excel"),
};

/**
 * Tailwind Classes.
 * tailwind classes that must replace in dom by js and createElement.
 */

const classes = {
  liClass:
    "w-full text-white text-lg flex justify-between items-center bg-[#312e81] p-[10px] rounded-t-[3px] rounded-r-[3px] mb-[5px] relative",
  buttonContainerClass: "flex justify-between items-center w-2/12",
  buttonClass: "cursor-pointer",
  todoTitleClass: "w-10/12 cursor-pointer relative",
  emptyClass: "text-center text-white text-2xl font-bold",
};

// states
let filter = "all";
let mode = "ADD_TODO"; // a flag for add or update (edit) todo
let todos = [];
let todoId = null;

//functions

/**
 * apply filter view in three modes.
 * one : just completed todos.
 * two : just incompleted todos
 * three : all todos
 */

function applyFilter(event) {
  if (event.target.tagName == "BUTTON") {
    let stashedTodo = getTodosFromStorage();
    let currentFilter = event.target.textContent;
    filter = currentFilter.trim();
    

    switch (filter) {
      case "completed": {
        todos = stashedTodo.filter((todo) => todo.isCompleted);        
        break;
      }
      case "inCompleted": {
        console.log('inCompleted');
        todos = stashedTodo.filter((todo) => !todo.isCompleted);
        break;
      }
      default: {
        todos = stashedTodo;
        break;
      }
    }
    loadTodoToDom();
  }
}

/**
 * Get todos from localStorage.
 * Parses and returns the stored todo list.
 * If parsing fails or no data exists, returns an empty array.
 * This version uses try/catch for safer parsing.
 */

function getTodosFromStorage() {
  // this function get all todos from local storage and returned it
  let stashedTodo = JSON.parse(localStorage.getItem("todos")) || [];
  return stashedTodo;
}

/**
 * validation input value.
 * checking input value that not be empty
 * checking for duplicate
 */

function validationInput() {
  let isDuplicate = todos.some(
    (todo) => todo.title.trim() == input.value.trim()
  );
  if (input.value.trim().length < 1) {
    Toastify({
      text : 'todo title can not be empty',
      close : true,
      position : 'left',
      stopOnFocus : true,
      style : {
        background : 'red'
      }
    }).showToast()
    return false;
  }
  if (isDuplicate) {
    Toastify({
      text : 'this todo already exist',
      close : true,
      position : 'left',
      stopOnFocus : true,
      style : {
        background : 'red'
      }
    }).showToast()
    return false;
  }
  return true;
}

/**
 * addTodo function have to mission.
 * - one : add todo to local storage and todos array if mode was ADD_TODO
 * - two : edit todo in local storage and todos array if mode was not ADD_TODO
 */

function addTodo(event) {
  event.preventDefault();
  const { input } = elements;
  let stashedTodo = getTodosFromStorage();

  if (validationInput()) {
    if (mode == "ADD_TODO") {
      let newTodo = {
        id: crypto.randomUUID(),
        title: input.value,
        isCompleted: false,
      }; // create new todo structure
      stashedTodo.push(newTodo); // add new todo to others
      todos = stashedTodo; // filled todos array with local storage datas
      localStorage.setItem("todos", JSON.stringify(stashedTodo)); // update local storage
    } else {
      const { input, addBtn } = elements;
      stashedTodo = stashedTodo.map(todo => todo.id == todoId ? {...todo , title : input.value.trim()} : todo)
      localStorage.setItem("todos", JSON.stringify(stashedTodo));
      todos = stashedTodo;
      addBtn.children[0].src = "../public/images/add_icon.svg";
      mode = "ADD_TODO";
    }
    loadTodoToDom();
  }
}

/**
 * load all todos to dom.
 * - read todos from local storage and append it in dom
 */

function loadTodoToDom() {
  const { todoContainer } = elements;
  todoContainer.innerHTML = "";

  if (!todos.length) {
    const emptyMessage = document.createElement("h1");
    emptyMessage.className = classes.emptyClass;
    emptyMessage.textContent = "Todos Are Undefined !!";
    todoContainer.appendChild(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = classes.liClass;

    const todoTitle = document.createElement("p");
    todoTitle.className = classes.todoTitleClass;
    todoTitle.textContent = todo.title;
    if (todo.isCompleted) todoTitle.classList.add("completed");
    todoTitle.onclick = e => changeStatusHanlder(e, todo.id);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = classes.buttonContainerClass;

    const deleteBtn = createButtonWithIcon(
      "../public/images/delete_icon.svg",
      () => removeTodo(todo.id),
      classes.buttonClass
    );
    const editBtn = createButtonWithIcon(
      "../public/images/edit_icon.svg",
      () => editTodo(todo.id, todo.title),
      classes.buttonClass
    );

    buttonContainer.append(deleteBtn, editBtn);
    li.append(todoTitle, buttonContainer);
    fragment.appendChild(li);
  });

  todoContainer.appendChild(fragment);
}

/**
 * Creates a button element with an icon inside.
 * - iconSrc: path to icon image
 * - onClickHandler: function to run on click
 * - className: CSS class for styling
 * Returns a ready-to-use <a> element with embedded <img>.
 */

function createButtonWithIcon(iconSrc, onClickHandler, className) {
  const btn = document.createElement("a");
  btn.className = className;
  btn.onclick = onClickHandler;

  const icon = document.createElement("img");
  icon.src = iconSrc;

  btn.appendChild(icon);
  return btn;
}

/**
 * remove todo from local storage and todos array .
 */

function removeTodo(id) {
  let stashedTodo = getTodosFromStorage();
  stashedTodo = stashedTodo.filter((todo) => todo.id != id);
  localStorage.setItem("todos", JSON.stringify(stashedTodo));
  todos = stashedTodo;
  loadTodoToDom();
}

/**
 * Toggle the completion status of a todo.
 * Uses map() to return a new array instead of mutating the original one.
 * Calls updateTodos() to sync state, save to storage, and refresh the DOM.
 */

function changeStatusHanlder(event, id) {
  event.currentTarget.classList.toggle("completed");
  let stashedTodo = getTodosFromStorage();
  stashedTodo = stashedTodo.map(todo => todo.id == id ? {...todo , isCompleted : !todo.isCompleted} : todo)
  localStorage.setItem("todos", JSON.stringify(stashedTodo));
  todos = stashedTodo;
  loadTodoToDom();
}

/**
 * a helper function for edit todo.
 * - id is todo id
 * - todo title repalced to input value
 * - todoId that is a state will filled with id argument of this function
 * add icon will changed
 */

function editTodo(id, todoTitle) {
  const { addBtn } = elements;
  addBtn.children[0].src = "../public/images/check_icon.svg";
  mode = "EDIT_TODO";
  todoId = id;
  elements.input.value = todoTitle;
}

/**
 * Export the current todo list to PDF format.
 * - uses jsPDF and jsPDF autoTable library to convert datas to pdf
 */

function exportToPdf() {
  window.jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF();
  autoTable(doc, {
    head: [["Row", "ID", "Title", "Status"]],
    body: todos.map((todo, index) => [
      index + 1,
      todo.id,
      todo.title,
      todo.isCompleted ? "Completed" : "Pending",
    ]),
  });
  doc.save("todos.pdf");
}

/**
 * Export the current todo list to Excel format.
 * Uses XLSX library to convert data to worksheet and trigger file download.
 */

function exportToExcel() {
  const worksheetData = todos.map((todo, index) => ({
    Row: index + 1,
    ID: todo.id,
    Title: todo.title,
    Status: todo.isCompleted ? "Completed" : "Pending",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Todos");

  XLSX.writeFile(workbook, "todos.xlsx");
}

/**
 * Export the current todo list to docx format.
 * Uses docxjs library to convert data to a word file.
 */

function exportToWord() {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType,
    BorderStyle,
  } = docx;

  const headerCells = ["Row", "ID", "Title", "Status"].map(
    (text) =>
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text, bold: true })] }),
        ],
        shading: { fill: "eeeeee" },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
        },
        width: { size: 33, type: WidthType.PERCENTAGE },
      })
  );

  const dataRows = todos.map(
    (todo, index) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(String(index + 1))],
            borders: getBorder(),
            width: { size: 33, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(todo.id.toString())],
            borders: getBorder(),
            width: { size: 33, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(todo.title)],
            borders: getBorder(),
            width: { size: 33, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph(todo.isCompleted ? "Completed" : "Pending"),
            ],
            borders: getBorder(),
            width: { size: 33, type: WidthType.PERCENTAGE },
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "📝 Todo List",
            heading: "Heading1",
            spacing: { after: 300 },
          }),
          new Table({
            rows: [new TableRow({ children: headerCells }), ...dataRows],
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "todos.docx";
    link.click();
  });

  function getBorder() {
    return {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
    };
  }
}

//events
elements.filtersElem.addEventListener("click", (event) => {
  event.preventDefault();
  applyFilter(event);
});

elements.addBtn.addEventListener("click", addTodo);

window.addEventListener("load", () => {
  todos = getTodosFromStorage(); // todos array will filled by local storage datas for first time
  loadTodoToDom(); // load todos for first time in dom
});

elements.pdfBtn.addEventListener("click", exportToPdf);
elements.excelBtn.addEventListener("click", exportToExcel);
elements.wordBtn.addEventListener("click", exportToWord)