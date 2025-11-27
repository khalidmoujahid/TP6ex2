// Gestionnaire d'événement pour le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Références aux éléments du DOM
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const clearAllBtn = document.getElementById('clearAll');
    
    // Éléments de statistiques
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    const pendingTasksElement = document.getElementById('pendingTasks');
    
    // Tableau pour stocker les tâches
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Initialisation de l'application
    initApp();
    
    // Fonction d'initialisation
    function initApp() {
        // Charger les tâches depuis le localStorage
        renderTasks();
        
        // Mettre à jour les statistiques
        updateStats();
        
        // Ajouter les écouteurs d'événements
        taskForm.addEventListener('submit', addTask);
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        clearAllBtn.addEventListener('click', clearAllTasks);
    }
    
    // Fonction pour ajouter une tâche
    function addTask(e) {
        e.preventDefault();
        
        const taskText = taskInput.value.trim();
        
        if (taskText === '') {
            showNotification('Veuillez entrer une tâche valide', 'error');
            return;
        }
        
        // Créer un nouvel objet tâche
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter la tâche au tableau
        tasks.push(newTask);
        
        // Sauvegarder dans le localStorage
        saveTasks();
        
        // Réinitialiser le champ de saisie
        taskInput.value = '';
        
        // Mettre à jour l'affichage
        renderTasks();
        updateStats();
        
        // Afficher une notification
        showNotification('Tâche ajoutée avec succès!', 'success');
    }
    
    // Fonction pour afficher les tâches
    function renderTasks() {
        // Vider la liste
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="empty-message">Aucune tâche pour le moment. Ajoutez votre première tâche !</li>';
            return;
        }
        
        // Trier les tâches (non complétées en premier)
        tasks.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Créer les éléments de tâche
        tasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }
    
    // Fonction pour créer un élément de tâche
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        li.innerHTML = `
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="btn-complete ${task.completed ? 'completed' : ''}">
                    ${task.completed ? 'Incomplète' : 'Terminer'}
                </button>
                <button class="btn-delete">Supprimer</button>
            </div>
        `;
        
        // Ajouter les écouteurs d'événements
        const completeBtn = li.querySelector('.btn-complete');
        const deleteBtn = li.querySelector('.btn-delete');
        
        completeBtn.addEventListener('click', () => toggleTaskCompletion(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return li;
    }
    
    // Fonction pour basculer l'état de complétion d'une tâche
    function toggleTaskCompletion(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateStats();
        
        const task = tasks.find(t => t.id === taskId);
        showNotification(
            task.completed ? 'Tâche marquée comme terminée!' : 'Tâche marquée comme non terminée!',
            'success'
        );
    }
    
    // Fonction pour supprimer une tâche
    function deleteTask(taskId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Tâche supprimée avec succès!', 'success');
        }
    }
    
    // Fonction pour supprimer toutes les tâches complétées
    function clearCompletedTasks() {
        const completedTasks = tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            showNotification('Aucune tâche complétée à supprimer', 'info');
            return;
        }
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${completedTasks.length} tâche(s) complétée(s) ?`)) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Tâches complétées supprimées avec succès!', 'success');
        }
    }
    
    // Fonction pour supprimer toutes les tâches
    function clearAllTasks() {
        if (tasks.length === 0) {
            showNotification('La liste est déjà vide', 'info');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches ?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Toutes les tâches ont été supprimées!', 'success');
        }
    }
    
    // Fonction pour mettre à jour les statistiques
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksElement.textContent = `Total: ${total} tâche${total !== 1 ? 's' : ''}`;
        completedTasksElement.textContent = `Complétées: ${completed}`;
        pendingTasksElement.textContent = `En attente: ${pending}`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
   
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    taskInput.focus();
});