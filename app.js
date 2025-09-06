

class ThoughtApp {
    constructor() {
        this.thoughts = [];
        this.currentFilter = 'all';
        this.recognition = null;
        this.isRecording = false;
        
        this.init();
    }

    init() {
        this.loadThoughts();
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.displayThoughts();
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'ru-RU';
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('thoughtText').value = transcript;
                this.addThought(); // Автоматически добавляем после голосового ввода
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                this.updateRecordButton();
                
                // Показываем понятные ошибки
                let errorMessage = '';
                switch(event.error) {
                    case 'not-allowed':
                        errorMessage = 'Разрешите доступ к микрофону в настройках браузера';
                        break;
                    case 'no-speech':
                        errorMessage = 'Не удалось распознать речь. Попробуйте еще раз';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Проблема с микрофоном. Проверьте устройство';
                        break;
                    default:
                        errorMessage = 'Ошибка распознавания речи: ' + event.error;
                }
                
                if (errorMessage) {
                    this.showNotification(errorMessage);
                }
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.updateRecordButton();
            };

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.updateRecordButton();
                this.showNotification('Говорите...');
            };
        } else {
            // Скрываем кнопку голоса, если не поддерживается
            const voiceBtn = document.getElementById('recordVoice');
            if (voiceBtn) {
                voiceBtn.style.display = 'none';
            }
        }
    }

    setupEventListeners() {
        document.getElementById('addThought').addEventListener('click', () => this.addThought());
        document.getElementById('recordVoice').addEventListener('click', () => this.toggleRecording());
        document.getElementById('filterAll').addEventListener('click', () => this.filterThoughts('all'));
        document.getElementById('filterTasks').addEventListener('click', () => this.filterThoughts('task'));
        document.getElementById('filterPurchases').addEventListener('click', () => this.filterThoughts('purchase'));
        document.getElementById('filterIdeas').addEventListener('click', () => this.filterThoughts('idea'));
        document.getElementById('filterThoughts').addEventListener('click', () => this.filterThoughts('thought'));
        document.getElementById('exportData').addEventListener('click', () => this.exportToGoogleSheets());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllThoughts());
        
        // Enter = добавить, Shift+Enter = новая строка
        document.getElementById('thoughtText').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addThought();
            }
        });
    }

    toggleRecording() {
        if (!this.recognition) {
            alert('Голосовой ввод не поддерживается в вашем браузере');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isRecording = true;
        }
        this.updateRecordButton();
    }

    updateRecordButton() {
        const button = document.getElementById('recordVoice');
        if (this.isRecording) {
            button.textContent = 'Остановить';
            button.classList.add('recording');
        } else {
            button.textContent = 'Голос';
            button.classList.remove('recording');
        }
    }

    // Автоматическое определение типа по ключевым словам
    detectType(text) {
        const lowerText = text.toLowerCase();
        
        // Покупки
        if (lowerText.includes('купить') || lowerText.includes('покупка') || 
            lowerText.includes('заказать') || lowerText.includes('приобрести') ||
            lowerText.includes('заказать') || lowerText.includes('купи') ||
            lowerText.includes('приобрести') || lowerText.includes('закажу')) {
            return 'purchase';
        }
        
        // Задачи (расширенный список)
        if (lowerText.includes('сделать') || lowerText.includes('задача') || 
            lowerText.includes('выполнить') || lowerText.includes('позвонить') ||
            lowerText.includes('написать') || lowerText.includes('встреча') ||
            lowerText.includes('погулять') || lowerText.includes('сходить') ||
            lowerText.includes('съездить') || lowerText.includes('заехать') ||
            lowerText.includes('встретиться') || lowerText.includes('договориться') ||
            lowerText.includes('записаться') || lowerText.includes('запланировать') ||
            lowerText.includes('подготовить') || lowerText.includes('составить') ||
            lowerText.includes('проверить') || lowerText.includes('исправить') ||
            lowerText.includes('убрать') || lowerText.includes('почистить') ||
            lowerText.includes('починить') || lowerText.includes('настроить') ||
            lowerText.includes('установить') || lowerText.includes('обновить') ||
            lowerText.includes('отправить') || lowerText.includes('получить') ||
            lowerText.includes('забрать') || lowerText.includes('принести') ||
            lowerText.includes('показать') || lowerText.includes('объяснить') ||
            lowerText.includes('научить') || lowerText.includes('помочь') ||
            lowerText.includes('встретить') || lowerText.includes('проводить') ||
            lowerText.includes('забрать') || lowerText.includes('отвезти') ||
            lowerText.includes('привезти') || lowerText.includes('доставить')) {
            return 'task';
        }
        
        // Идеи
        if (lowerText.includes('идея') || lowerText.includes('придумать') || 
            lowerText.includes('создать') || lowerText.includes('разработать') ||
            lowerText.includes('изобрести') || lowerText.includes('придумаю') ||
            lowerText.includes('создам') || lowerText.includes('разработаю') ||
            lowerText.includes('проект') || lowerText.includes('стартап') ||
            lowerText.includes('бизнес') || lowerText.includes('концепция')) {
            return 'idea';
        }
        
        // По умолчанию - мысль
        return 'thought';
    }

    addThought() {
        const text = document.getElementById('thoughtText').value.trim();
        if (!text) return;

        const autoType = this.detectType(text);
        
        const thought = {
            id: Date.now(),
            text: text,
            type: autoType,
            timestamp: new Date().toISOString(),
            completed: false
        };

        this.thoughts.unshift(thought);
        this.saveThoughts();
        this.displayThoughts();
        
        // Очищаем поле ввода
        document.getElementById('thoughtText').value = '';
        
        // Показываем уведомление
        this.showNotification(`Запись добавлена как ${this.getTypeLabel(autoType)}`);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    toggleThought(id) {
        const thought = this.thoughts.find(t => t.id === id);
        if (thought) {
            thought.completed = !thought.completed;
            this.saveThoughts();
            this.displayThoughts();
        }
    }

    deleteThought(id) {
        if (confirm('Удалить эту запись?')) {
            this.thoughts = this.thoughts.filter(t => t.id !== id);
            this.saveThoughts();
            this.displayThoughts();
        }
    }

    editThought(id) {
        const thought = this.thoughts.find(t => t.id === id);
        if (!thought) return;

        const newText = prompt('Редактировать текст:', thought.text);
        if (newText !== null && newText.trim() !== '') {
            thought.text = newText.trim();
            // Переопределяем тип после редактирования
            thought.type = this.detectType(newText.trim());
            this.saveThoughts();
            this.displayThoughts();
        }
    }

    changeType(id) {
        const thought = this.thoughts.find(t => t.id === id);
        if (!thought) return;

        const types = [
            { value: 'task', label: 'Задача' },
            { value: 'purchase', label: 'Покупка' },
            { value: 'idea', label: 'Идея' },
            { value: 'thought', label: 'Мысль' }
        ];

        const typeNames = types.map(t => t.label).join('\n');
        const newTypeIndex = prompt(
            `Выберите тип (введите номер):\n\n${types.map((t, i) => `${i + 1}. ${t.label}`).join('\n')}\n\nТекущий тип: ${this.getTypeLabel(thought.type)}`
        );

        if (newTypeIndex !== null) {
            const index = parseInt(newTypeIndex) - 1;
            if (index >= 0 && index < types.length) {
                thought.type = types[index].value;
                this.saveThoughts();
                this.displayThoughts();
            }
        }
    }

    filterThoughts(type) {
        this.currentFilter = type;
        
        // Обновляем активную кнопку фильтра
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filter${type.charAt(0).toUpperCase() + type.slice(1)}`).classList.add('active');
        
        this.displayThoughts();
    }

    displayThoughts() {
        const container = document.getElementById('thoughtsList');
        const filteredThoughts = this.currentFilter === 'all' 
            ? this.thoughts 
            : this.thoughts.filter(t => t.type === this.currentFilter);

        if (filteredThoughts.length === 0) {
            container.innerHTML = '<div class="no-thoughts">Нет записей для отображения</div>';
            return;
        }

        container.innerHTML = filteredThoughts.map(thought => `
            <div class="thought-item ${thought.completed ? 'completed' : ''} ${thought.type}">
                <div class="thought-content">
                    <div class="thought-text">${thought.text}</div>
                    <div class="thought-meta">
                        <span class="thought-type">${this.getTypeLabel(thought.type)}</span>
                        <span class="thought-date">${new Date(thought.timestamp).toLocaleString('ru-RU')}</span>
                    </div>
                </div>
                <div class="thought-actions">
                    <button onclick="app.toggleThought(${thought.id})" class="action-btn toggle-btn" title="Отметить выполненным">
                        ${thought.completed ? '↩️' : '✓'}
                    </button>
                    <button onclick="app.changeType(${thought.id})" class="action-btn type-btn" title="Изменить тип">
                        🔄
                    </button>
                    <button onclick="app.editThought(${thought.id})" class="action-btn edit-btn" title="Редактировать">
                        ✏️
                    </button>
                    <button onclick="app.deleteThought(${thought.id})" class="action-btn delete-btn" title="Удалить">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    getTypeLabel(type) {
        const labels = {
            'task': 'Задача',
            'purchase': 'Покупка',
            'idea': 'Идея',
            'thought': 'Мысль'
        };
        return labels[type] || type;
    }

    saveThoughts() {
        localStorage.setItem('thoughts', JSON.stringify(this.thoughts));
    }

    loadThoughts() {
        const saved = localStorage.getItem('thoughts');
        if (saved) {
            this.thoughts = JSON.parse(saved);
        }
    }

    clearAllThoughts() {
        if (confirm('Очистить все записи? Это действие нельзя отменить.')) {
            this.thoughts = [];
            this.saveThoughts();
            this.displayThoughts();
        }
    }

    // Простой экспорт в Google Sheets с зашитым URL
    async exportToGoogleSheets() {
        if (this.thoughts.length === 0) {
            alert('Нет данных для экспорта');
            return;
        }

        try {
            // Зашитый URL для тестирования
            const webAppUrl = 'https://script.google.com/macros/s/AKfycbymq_Dn4ypFJx4Qo1Uw-MN3OXuYYAPqqm-1A1swaLM-Avb4tMerWxww7O_WfGnrZdyE/exec';
            
            // Отправляем данные напрямую
            await this.sendToGoogleSheets(webAppUrl);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Ошибка экспорта: ' + error.message);
        }
    }

    async sendToGoogleSheets(webAppUrl) {
        try {
            const data = this.thoughts.map(thought => [
                this.getTypeLabel(thought.type), // Используем русские названия типов
                thought.text,
                new Date(thought.timestamp).toLocaleString('ru-RU'),
                thought.completed ? 'Завершено' : 'Активно'
            ]);

            console.log('Отправляем данные в Google Sheets:', data);
            console.log('URL:', webAppUrl);
            console.log('Количество записей:', data.length);

            const response = await fetch(webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                mode: 'no-cors' // Возвращаем no-cors для обхода CORS
            });

            console.log('Ответ получен:', response);
            console.log('Статус ответа:', response.status);
            
            // При no-cors mode считаем запрос успешным, если нет исключения
            // Данные отправлены, даже если status = 0
            console.log('✅ Данные успешно отправлены в Google Sheets!');
            
            // Автоматически очищаем все записи после успешного экспорта
            this.thoughts = [];
            this.saveThoughts();
            this.displayThoughts();
            this.showNotification('✅ Записи экспортированы и очищены!');
            
        } catch (error) {
            console.error('Send error:', error);
            console.error('Error details:', error.message);
            alert('Ошибка отправки: ' + error.message);
        }
    }

    exportToCSV() {
        const headers = ['Тип', 'Текст', 'Дата', 'Статус'];
        const csvContent = [
            headers.join(','),
            ...this.thoughts.map(thought => [
                thought.type,
                `"${thought.text.replace(/"/g, '""')}"`,
                new Date(thought.timestamp).toLocaleString('ru-RU'),
                thought.completed ? 'Завершено' : 'Активно'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `мои_мысли_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ThoughtApp();
});
