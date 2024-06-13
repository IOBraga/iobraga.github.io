document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const taskLists = {
        'pendente': document.getElementById('pending-list'),
        'em-andamento': document.getElementById('in-progress-list'),
        'concluída': document.getElementById('completed-list')
    };

    let editTaskId = null; // Armazena o ID da tarefa sendo editada

    // Abre o modal para adicionar uma nova tarefa
    addTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'block';
        taskForm.reset(); // Reseta o formulário
        editTaskId = null; // Limpa o ID da tarefa sendo editada
    });

    // Fecha o modal quando o botão de fechar é clicado
    closeModalBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    // Fecha o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target == taskModal) {
            taskModal.style.display = 'none';
        }
    });

    // Processa o formulário de nova tarefa
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita o envio padrão do formulário

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const priority = document.getElementById('priority').value;
        const dueDate = document.getElementById('due-date').value;
        const responsibles = document.getElementById('responsibles').value;
        const status = document.getElementById('status').value;

        const taskData = {
            title,
            description,
            priority,
            dueDate,
            responsibles,
            status
        };

        if (editTaskId) {
            taskData.id = editTaskId;
            updateTaskInDB(taskData); // Atualiza a tarefa no IndexedDB
            updateTaskElement(taskData); // Atualiza a tarefa no DOM
        } else {
            taskData.id = Date.now(); // Usa a data e hora atual como ID da tarefa
            saveTaskToDB(taskData); // Salva a tarefa no IndexedDB
            const taskElement = createTaskElement(taskData);
            taskLists[status.toLowerCase().replace(' ', '-')].appendChild(taskElement);
        }

        taskModal.style.display = 'none'; // Fecha o modal após adicionar a tarefa
    });

    // Função para criar um elemento de tarefa
    function createTaskElement(taskData) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.draggable = true;
        taskElement.dataset.id = taskData.id;

        // Aplica os estilos às tarefas
        applyTaskStyles(taskElement, taskData);

        taskElement.innerHTML = `
            <h3>${taskData.title}</h3>
            <p>${taskData.description}</p>
            <p><strong>Prioridade:</strong> ${taskData.priority}</p>
            <p><strong>Data de Vencimento:</strong> ${taskData.dueDate}</p>
            <p><strong>Responsáveis:</strong> ${taskData.responsibles}</p>
            <p><strong>Status:</strong> ${taskData.status}</p>
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Excluir</button>
        `;

        // Adiciona os eventos de drag e drop
        taskElement.addEventListener('dragstart', handleDragStart);
        taskElement.addEventListener('dragend', handleDragEnd);

        // Adiciona os eventos de clique para editar e excluir
        taskElement.querySelector('.edit-btn').addEventListener('click', () => editTask(taskData));
        taskElement.querySelector('.delete-btn').addEventListener('click', () => deleteTask(taskData.id));

        return taskElement;
    }

    // Função para aplicar estilos a uma tarefa com base em seu status e data de vencimento
    function applyTaskStyles(taskElement, taskData) {
        // Remove todas as classes de notificação primeiro
        taskElement.classList.remove('completed', 'due-soon', 'overdue');

        // Verifica o status da tarefa
        if (taskData.status === 'Concluída') {
            taskElement.classList.add('completed');
        } else {
            const dueDate = new Date(taskData.dueDate);
            const now = new Date();
            const timeDiff = dueDate - now;

            // Verifica se a tarefa está atrasada ou próxima do vencimento
            if (timeDiff < 0) {
                taskElement.classList.add('overdue');
            } else if (timeDiff < 3 * 24 * 60 * 60 * 1000) { // 3 dias em milissegundos
                taskElement.classList.add('due-soon');
            }
        }
    }

    // Função para editar uma tarefa
    function editTask(taskData) {
        document.getElementById('title').value = taskData.title;
        document.getElementById('description').value = taskData.description;
        document.getElementById('priority').value = taskData.priority;
        document.getElementById('due-date').value = taskData.dueDate;
        document.getElementById('responsibles').value = taskData.responsibles;
        document.getElementById('status').value = taskData.status;

        editTaskId = taskData.id;
        taskModal.style.display = 'block';
    }

    // Função para atualizar um elemento de tarefa no DOM
    function updateTaskElement(taskData) {
        const taskElement = document.querySelector(`[data-id='${taskData.id}']`);
        taskElement.innerHTML = `
            <h3>${taskData.title}</h3>
            <p>${taskData.description}</p>
            <p><strong>Prioridade:</strong> ${taskData.priority}</p>
            <p><strong>Data de Vencimento:</strong> ${taskData.dueDate}</p>
            <p><strong>Responsáveis:</strong> ${taskData.responsibles}</p>
            <p><strong>Status:</strong> ${taskData.status}</p>
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Excluir</button>
        `;

        // Aplica os estilos novamente
        applyTaskStyles(taskElement, taskData);

        // Adiciona os eventos de clique para editar e excluir
        taskElement.querySelector('.edit-btn').addEventListener('click', () => editTask(taskData));
        taskElement.querySelector('.delete-btn').addEventListener('click', () => deleteTask(taskData.id));
    }

    // Função para excluir uma tarefa
    function deleteTask(taskId) {
        deleteTaskFromDB(taskId); // Remove a tarefa do IndexedDB
        document.querySelector(`[data-id='${taskId}']`).remove(); // Remove a tarefa do DOM
    }

    // Eventos de drag and drop
    function handleDragStart(event) {
        event.dataTransfer.setData('text/plain', event.target.dataset.id);
    }

    function handleDragEnd(event) {
        const taskId = event.dataTransfer.getData('text/plain');
        const newStatus = event.target.closest('.task-list').id.replace('-list', '').replace('-', ' ');

        updateTaskStatusInDB(taskId, newStatus);
    }

    // Adiciona eventos de drag and drop para as colunas
    Object.values(taskLists).forEach(list => {
        list.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        list.addEventListener('drop', (event) => {
            event.preventDefault();
            const taskId = event.dataTransfer.getData('text/plain');
            const taskElement = document.querySelector(`[data-id='${taskId}']`);

            // Adiciona a tarefa à nova coluna
            event.target.closest('.task-list').appendChild(taskElement);

            // Atualiza o status da tarefa no banco de dados
            const newStatus = event.target.closest('.task-list').id.replace('-list', '').replace('-', ' ');
            updateTaskStatusInDB(taskId, newStatus);
        });
    });

    // Carrega as tarefas salvas do banco de dados
    loadTasks();
});
