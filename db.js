const dbName = "kanbanDB";
const dbVersion = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            const objectStore = db.createObjectStore("tasks", { keyPath: "id" });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.errorCode);
        };
    });
}

function saveTaskToDB(taskData) {
    const transaction = db.transaction(["tasks"], "readwrite");
    const objectStore = transaction.objectStore("tasks");
    objectStore.add(taskData);
}

function updateTaskInDB(taskData) {
    const transaction = db.transaction(["tasks"], "readwrite");
    const objectStore = transaction.objectStore("tasks");
    objectStore.put(taskData);
}

function deleteTaskFromDB(taskId) {
    const transaction = db.transaction(["tasks"], "readwrite");
    const objectStore = transaction.objectStore("tasks");
    objectStore.delete(taskId);
}

function updateTaskStatusInDB(taskId, newStatus) {
    const transaction = db.transaction(["tasks"], "readwrite");
    const objectStore = transaction.objectStore("tasks");

    const request = objectStore.get(taskId);
    request.onsuccess = (event) => {
        const taskData = event.target.result;
        taskData.status = newStatus;
        objectStore.put(taskData);
    };
}

function loadTasks() {
    openDB().then(() => {
        const transaction = db.transaction(["tasks"], "readonly");
        const objectStore = transaction.objectStore("tasks");

        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const taskData = cursor.value;
                const taskElement = createTaskElement(taskData);
                const status = taskData.status.toLowerCase().replace(' ', '-');
                document.getElementById(`${status}-list`).appendChild(taskElement);
                cursor.continue();
            }
        };
    });
}