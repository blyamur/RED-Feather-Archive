// Объявляем переменные в начале
let currentLanguage;
const SUPPORTED_LANGUAGES = ['ru', 'en'];
const DEFAULT_LANGUAGE = 'ru';

// Функция для определения языка
function getBrowserLanguage() {
    return localStorage.getItem('userLanguage') || 
           currentLanguage || 
           navigator.language.split('-')[0] || 
           DEFAULT_LANGUAGE;
}

// Функция для получения текущего языка с проверкой
function getCurrentLanguage() {
    const lang = getBrowserLanguage();
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
}

// Инициализация
currentLanguage = getCurrentLanguage();
let translations = {};
const i18nObservers = [];

// Функция для подписки на изменения языка
function subscribeI18n(callback) {
    i18nObservers.push(callback);
    return () => {
        const index = i18nObservers.indexOf(callback);
        if (index > -1) i18nObservers.splice(index, 1);
    };
}

// Применяем переводы к конкретному элементу
function localizeElement(element) {
    // Текст элемента
    if (element.hasAttribute('data-i18n')) {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    }
    // Текст элемента в html
    if (element.hasAttribute('data-i18n-html')) {
        const key = element.getAttribute('data-i18n-html');
        if (translations[key]) {
            element.innerHTML  = translations[key];
        }
    }
    // Placeholder
    if (element.hasAttribute('data-i18n-placeholder')) {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            element.placeholder = translations[key];
        }
    }

    // Title
    if (element.hasAttribute('data-i18n-title')) {
        const key = element.getAttribute('data-i18n-title');
        if (translations[key]) {
            element.title = translations[key];
        }
    }

    // Alt
    if (element.hasAttribute('data-i18n-alt')) {
        const key = element.getAttribute('data-i18n-alt');
        if (translations[key]) {
            element.alt = translations[key];
        }
    }
}

// Применяем переводы ко всей странице
function applyTranslations(root = document) {
    // Все элементы с атрибутами локализации
    const elements = root.querySelectorAll(`
        [data-i18n],
        [data-i18n-placeholder],
        [data-i18n-title],
        [data-i18n-alt],
        [data-i18n-html]
    `);

    elements.forEach(localizeElement);

    // Title страницы
    if (translations['page.title']) {
        document.title = translations['page.title'];
    }

    // Уведомляем подписчиков
    i18nObservers.forEach(cb => cb());
}

// Загрузка переводов
let loadedLanguages = [];

async function loadTranslations(lang) {
    if (loadedLanguages.includes(lang)) return true;
    try {
        // Загружаем JS с переводами
        const jsResponse = await fetch(`/static/locales/${lang}/translations.js`);
        if (!jsResponse.ok) throw new Error('Translations JS not found');
        
        const jsText = await jsResponse.text();
        const script = document.createElement('script');
        script.text = jsText;
        document.head.appendChild(script).parentNode.removeChild(script);

        // Загружаем JSON с UI переводами
        const jsonResponse = await fetch(`/static/locales/${lang}/ui.json`);
        if (!jsonResponse.ok) throw new Error('UI translations not found');
        
        translations = {...translations, ...await jsonResponse.json()};
        
        // Применяем переводы
        applyTranslations();
        
        // Сохраняем язык
        currentLanguage = lang;
        localStorage.setItem('userLanguage', lang);
        
        return true;
    } catch (error) {
        console.error('Error loading translations:', error);
        return false;
    }
 loadedLanguages.push(lang);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('userLanguage');
    loadTranslations(savedLanguage || getBrowserLanguage());
});

// MutationObserver для динамических элементов
const i18nObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                applyTranslations(node);
            }
        });
    });
});

i18nObserver.observe(document.body, {
    childList: true,
    subtree: true
});


function confirmTranslated(translationKey, params = {}) {
    const message = getTranslation(translationKey, params);
    return confirm(message);
}

// Улучшенная версия getTranslation с параметрами
function getTranslation(key, params = {}) {
    let message = translations[key] || key;
    Object.entries(params).forEach(([param, value]) => {
        message = message.replace(`{${param}}`, value);
    });
    return message;
}

// Обновлённый Notify для поддержки параметров
const Notify = {
    error: (key, params) => showNotice('error', getTranslation(key, params)),
    success: (key, params) => showNotice('ok', getTranslation(key, params)),
    raw: (mode, text) => showNotice(mode, text)
};

// Ваша существующая функция (без изменений)
function showNotice(mode, message) {
    const noticeLine = document.querySelector('.notice-line');
    if (!noticeLine) return;

    const statusColor = mode === 'error' ? 'red' : 'green';
    noticeLine.textContent = message;
    noticeLine.classList.remove('hidden');
    noticeLine.classList.add(statusColor);

    setTimeout(() => {
        noticeLine.classList.add('hidden');
        noticeLine.classList.remove(statusColor);
    }, 1500);
}

// Функция для переключения языка
async function switchLanguage() {
    const flagDiv = document.querySelector('#language-switch div');
    let newLanguage;

    if (flagDiv.classList.contains('language-ru')) {
        flagDiv.classList.replace('language-ru', 'language-us');
        newLanguage = 'en';
    } else {
        flagDiv.classList.replace('language-us', 'language-ru');
        newLanguage = 'ru';
    }

    // Отправляем запрос на сервер для смены языка
    const response = await fetch(`/set_language/${newLanguage}`, { method: 'POST' });
    if (!response.ok) {
        showNotice('error', 'Ошибка смены языка');
        flagDiv.classList.toggle('language-ru language-us'); // Откатываем изменение флага
        return;
    }

    // Сохраняем язык и загружаем переводы
    localStorage.setItem('userLanguage', newLanguage);
    currentLanguage = newLanguage;
    
    const success = await loadTranslations(newLanguage);
    if (!success) {
        showNotice('error', 'Ошибка загрузки переводов');
        flagDiv.classList.toggle('language-ru language-us'); // Откатываем изменение флага
    } else {
        showNotice('success', newLanguage === 'en' 
            ? 'Language switched to English' 
            : 'Язык изменён на русский');
    }
}


// Вешаем обработчик
document.getElementById('language-switch').addEventListener('click', function(e) {
    e.preventDefault();
    switchLanguage();
});

document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('userLanguage') || getBrowserLanguage();
    const flagDiv = document.querySelector('#language-switch div');
    
    if (lang === 'ru') {
        flagDiv.classList.add('language-ru');
        flagDiv.classList.remove('language-us');
    } else {
        flagDiv.classList.add('language-us');
        flagDiv.classList.remove('language-ru');
    }
    
    loadTranslations(lang);
});

function getCookie(name) {
	var cookies = document.cookie.split(';');
	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i].trim();
		if (cookie.indexOf(name + '=') === 0) {
			return cookie.substring(name.length + 1);
		}
	}
	return null;
}

// Функция для установки темной или светлой темы
function toggleDarkMode() {
	var modeSwitch = document.querySelector('.mode-switch');
	var darkIcon = document.getElementById('dark-light');
	// Переключаем класс 'dark' на элементе <html>
	document.documentElement.classList.toggle('dark');
	modeSwitch.classList.toggle('active');
	// Переключаем иконку между 'sun' и 'moon'
	if (darkIcon.classList.contains('fa-sun')) {
		darkIcon.classList.remove('fa-sun');
		darkIcon.classList.add('fa-moon');
		document.cookie = 'DarkThemeFB=Night_Day; expires=Sun, 01 Jan 2035 00:00:00 UTC; path=/';
	} else {
		darkIcon.classList.remove('fa-moon');
		darkIcon.classList.add('fa-sun');
		document.cookie = 'DarkThemeFB=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
	}
}

// Обработчик клика для переключения темы
document.addEventListener('click', function(event) {
	if (event.target.closest('.mode-switch')) {
		event.preventDefault();
		toggleDarkMode();
	}
});

// Функция для смены видимости
function toggleBlurMode() {
	var blurIcon = document.getElementById('blur-unblur');
	const elements = document.querySelectorAll('.preview-image');
	if (blurIcon.classList.contains('fa-eye-slash')) {
		// Включаем видимость (убираем blur)
		blurIcon.classList.remove('fa-eye-slash');
		blurIcon.classList.add('fa-eye');
		document.cookie = 'BlurMode=Blur_disabled; expires=Sun, 01 Jan 2035 00:00:00 UTC; path=/';
		elements.forEach(element => {
			element.classList.remove('blur');
		});
	} else {
		// Отключаем видимость (добавляем blur)
		blurIcon.classList.remove('fa-eye');
		blurIcon.classList.add('fa-eye-slash');
		document.cookie = 'BlurMode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
		elements.forEach(element => {
			element.classList.add('blur');
		});
	}
}
// Обработчик клика для переключения размытия
document.addEventListener('click', function(event) {
	if (event.target.closest('.blur-switch')) {
		event.preventDefault();
		toggleBlurMode();
	}
});
// Инициализация состояния размытия при загрузке страницы

function initializeBlurMode() {
	const blurIcon = document.getElementById('blur-unblur');
	if (!blurIcon) {
		return; // Выходим из функции, если элемент отсутствует
	}
	const blurMode = getCookie('BlurMode');
	const elements = document.querySelectorAll('.preview-image');
	if (blurMode === 'Blur_disabled') {
		// Убираем blur и меняем иконку на "глаз"
		blurIcon.classList.remove('fa-eye-slash');
		blurIcon.classList.add('fa-eye');
		elements.forEach(element => {
			element.classList.remove('blur');
		});
	} else {
		// Добавляем blur и меняем иконку на "зачеркнутый глаз"
		blurIcon.classList.remove('fa-eye');
		blurIcon.classList.add('fa-eye-slash');
		elements.forEach(element => {
			element.classList.add('blur');
		});
	}
}
 

// Обработчик для ссылки "Все файлы"
document.getElementById('show-all-files').addEventListener('click', function(e) {
	e.preventDefault();
	applyTranslations();
	initializeBlurMode();
	loadContent('/all_files');
});
// Обработчик для ссылки "Редактировать теги"
document.getElementById('edit-tags').addEventListener('click', function(e) {
	e.preventDefault();
	applyTranslations();
	initializeBlurMode();
	loadContent('/edit_tags');
});

document.getElementById('clear-db').addEventListener('click', function(e) {
	e.preventDefault(); // Предотвращаем стандартное поведение ссылки
	// Запрашиваем подтверждение у пользователя
	if (confirmTranslated('confirm.clear_db')) {
		// Отправляем AJAX-запрос на сервер
		fetch('/clear_db', {
			method: 'POST'
		}).then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		}).then(data => {
			Notify.raw('success', data.message);  // Показываем сообщение об успешной очистке
			location.reload(); // Перезагружаем страницу для обновления интерфейса
		}).
		catch(error => {
			Notify.error('error.clear_db'); //Произошла ошибка при очистке базы данных
		});
	}
});

document.getElementById('check_files').addEventListener('click', function(e) {
	e.preventDefault(); // Предотвращаем стандартное поведение ссылки
	// Отправляем AJAX-запрос на сервер
	fetch('/check_files', {
		method: 'POST'
	}).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then(data => {
		Notify.raw('success', data.message); // Показываем сообщение об успешной проверке
	}).
	catch(error => {
		Notify.error('error.check_files'); //Произошла ошибка при проверке базы данных
	});
});

document.getElementById('on_add_files').addEventListener('click', async function(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/add_files_dialog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Unknown error');
        }
        
        Notify.success('files.added.success', {count: data.count});
        updateFileList();
    } catch (error) {
        Notify.error('error.add_files', {error: error.message});
    }
});

// Функция для обновления списка файлов
function updateFileList() {
    fetch('/all_files')
        .then(response => response.text()) // Получаем текст вместо JSON
        .then(html => {
            // Вставляем HTML прямо в DOM
            const container = document.getElementById('file-list-container');
            if (container) {
                container.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('Error updating file list:', error);
            Notify.error('error.update_file_list');
        });
}


document.addEventListener('DOMContentLoaded', function() {
	// Делегирование событий для динамически подгружаемых элементов
	document.addEventListener('click', function(e) {
		// Показать кнопку "Сохранить" при клике на редактируемое имя файла
		if (e.target.matches('#file-cur-name')){
			const saveButton = e.target.nextElementSibling; // Находим кнопку "Сохранить"
			if (saveButton && saveButton.classList.contains('save-name')) {
				saveButton.classList.remove('hidden'); // Убираем класс hidden
			}
		}
		// Обработка клика на кнопку "Сохранить"
		if (e.target.closest('.save-name')) {
			e.preventDefault();
			const saveButton = e.target.closest('.save-name');
			const fileId = saveButton.getAttribute('data-file-id'); // Получаем ID файла
			const fileCurNameElement = saveButton.previousElementSibling; // Находим элемент с именем файла
			if (!fileId || !fileCurNameElement) {
				return;
			}
			const newName = fileCurNameElement.textContent.trim(); // Получаем новое имя файла
			// Отправляем AJAX-запрос для сохранения нового имени в базу данных
			fetch(`/save_file_name/${fileId}`,{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: newName
				})
			}).then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			}).then(data => {
				if (data.message) {
					Notify.success('success.save_file_name');//Название успешно изменено
				} else if (data.error) {
					Notify.error('error.save_file_name');
				}
			}).
			catch(error => {
				Notify.error('error.save_file_name'); //Произошла ошибка при сохранении
			}).
			finally(() => {
				// Снимаем фокус и скрываем кнопку "Сохранить"
				fileCurNameElement.blur();
				saveButton.classList.add('hidden');
			});
		}
	});
});

document.addEventListener('DOMContentLoaded', function () {
    // Функция для обновления счетчика выбранных чекбоксов
    function updateCheckedCount() {
        const checkboxes = document.querySelectorAll('.file-item-edit input[type="checkbox"]');
        const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
        // Обновляем текст счетчика
        const countCheckedSpan = document.getElementById('count-checked');
        if (countCheckedSpan) {
            countCheckedSpan.textContent = checkedCount;
        }
        // Показываем или скрываем блок .checked-list
        const checkedList = document.querySelector('.checked-list');
        if (checkedList) {
            if (checkedCount > 0) {
                checkedList.classList.remove('hidden');
            } else {
                checkedList.classList.add('hidden');
            }
        }
    }

    // Делегирование событий для динамически создаваемых элементов
    document.addEventListener('click', function (e) {
        // Обработка клика на "Выбрать все"
        if (e.target.id === 'check-all_files') {
            e.preventDefault();
            const checkboxes = document.querySelectorAll('.file-item-edit input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true; // Устанавливаем галочки для всех чекбоксов
            });
            updateCheckedCount(); // Обновляем счетчик
        }

        // Обработка клика на "Снять выбор"
        if (e.target.id === 'uncheck-all_files') {
            e.preventDefault();
            const checkboxes = document.querySelectorAll('.file-item-edit input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false; // Снимаем галочки со всех чекбоксов
            });
            updateCheckedCount(); // Обновляем счетчик
        }

        // Обработка клика на "Удалить из базы"
        if (e.target.closest('#delete-file-base-list')) {
            e.preventDefault();
            handleDelete('base');
        }

        // Обработка клика на "Удалить из системы"
        if (e.target.closest('#delete-file-system-list')) {
            e.preventDefault();
            handleDelete('system');
        }
    });

    // Делегирование событий для изменения состояния чекбоксов
    document.addEventListener('change', function (e) {
        if (e.target.matches('.file-item-edit input[type="checkbox"]')) {
            updateCheckedCount(); // Обновляем счетчик при изменении состояния любого чекбокса
        }
    });

    // Инициализация начального состояния счетчика
    updateCheckedCount();

    // Функция для обработки удаления
    function handleDelete(type) {
    const checkboxes = document.querySelectorAll('.file-item-edit input[type="checkbox"]');
    const selectedIds = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    // Проверка выбранных файлов
    if (selectedIds.length === 0) {
        Notify.error('error.delete_files.empty');
        return;
    }

    // Confirm с переводом
    const confirmKey = type === 'base' ? 'confirm.delete_base' : 'confirm.delete_system';
    if (!confirmTranslated(confirmKey)) {
        return;
    }

    // Отправка запроса
    fetch('/delete_files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file_ids: selectedIds,
            delete_type: type
        })
    })
    .then(response => {
        if (!response.ok) {
            // Для HTTP-ошибок
            throw new Error(response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            // Ошибка от сервера
            Notify.raw('error', `${getTranslation('error.prefix')} ${data.error}`);
        } else {
            // Успешное удаление
            Notify.success('success.delete_files', {
                details: data.message || ''
            });
            
            // Удаление DOM-элементов
            data.deleted_ids?.forEach(fileId => {
                document.querySelector(`.file-item-edit[data-file-id="${fileId}"]`)?.remove();
            });
            updateCheckedCount();
        }
    })
    .catch(error => {
        // Сетевые/критические ошибки
        Notify.error('error.delete_failed');
        console.error('Delete error:', error);
    });
  }
});



// Делегирование событий для динамического контента
document.addEventListener('click', function(e) {
	// Проверяем, был ли клик выполнен на элементе .save-tags или его дочерних элементах
	const saveTagsButton = e.target.closest('.save-tags');
	if (saveTagsButton) {
		e.preventDefault();
		const fileId = saveTagsButton.getAttribute('data-file-id');
		if (!fileId) {
			return;
		}
		// Находим родительский контейнер для текущего элемента
		const fileItemEdit = saveTagsButton.closest('.file-item-edit');
		if (!fileItemEdit) {
			return;
		}
		// Собираем теги только из текущего контейнера
		const tagsList = [];
		fileItemEdit.querySelectorAll('.tags-input-tag span').forEach(function(span) {
			tagsList.push(span.textContent.trim());
		});
		const tags = tagsList.join(',');
		if (!tags) {
			Notify.error('error.empty_tags'); //Теги не могут быть пустыми
			return;
		}
		// AJAX-запрос для сохранения тегов
		fetch(`/update_tags/${fileId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: `tags=${encodeURIComponent(tags)}`
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			}).then(data => {
				if (data.message) {
					
					Notify.raw('success', data.message);
					// Обновляем атрибут data-saved-tags
					const tagsListInput = fileItemEdit.querySelector('.tags-list-input');
					if (tagsListInput) {
						tagsListInput.setAttribute('data-saved-tags', tags); // Сохраняем список тегов
					}
					// Удаляем класс grey у всех тегов
					fileItemEdit.querySelectorAll('.tags-input-tag').forEach(tagElement => {
						tagElement.classList.remove('grey');
					});
					// Обновляем список тегов
					updateTags(tagsListInput, tags.split(','));
				} else if (data.error) {
					Notify.raw('error', data.error);
				}
			}).
		catch(error => {
			Notify.error('error.save_tags'); //Произошла ошибка при сохранении тегов 
		});
		return; // Завершаем обработку, чтобы не проверять другие условия
	}
	
	// Проверяем, был ли клик выполнен на элементе .delete-file или его дочерних элементах
	const deleteFileButton = e.target.closest('.delete-file');
	if (deleteFileButton) {
		e.preventDefault();
		const fileId = deleteFileButton.getAttribute('data-file-id');
		if (confirmTranslated('confirm.delete_file_base')) {
			// AJAX-запрос для удаления файла
			fetch(`/delete_file/${fileId}`, {
				method: 'POST'
			}).then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			}).then(data => {
				Notify.success('success.file_deletion_success'); //Файл успешно удален из базы данных
				// Удаляем элемент из интерфейса
				deleteFileButton.closest('.file-item-edit').remove();
			}).
			catch(error => {
				Notify.error('error.file_deletion_error'); //Произошла ошибка при удалении файла
			});
		}
		return; // Завершаем обработку, чтобы не проверять другие условия
	}
	// Обработка клика на "Удалить файл из системы"
	const deleteFileSystemButton = e.target.closest('.delete-file-system');
	if (deleteFileSystemButton) {
		e.preventDefault(); // Предотвращаем стандартное поведение ссылки
		const fileId = deleteFileSystemButton.getAttribute('data-file-id');
		if (!fileId) {
			return;
		}
		if (confirmTranslated('confirm.delete_file_system')) {
			// AJAX-запрос для удаления файла
			fetch(`/delete_file_system/${fileId}`, {
				method: 'POST'
			}).then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			}).then(data => {
				Notify.success('success.delete_file_system'); //Файл успешно удален из базы данных и системы
				// Удаляем элемент из интерфейса
				const fileItemEdit = deleteFileSystemButton.closest('.file-item-edit');
				if (fileItemEdit) {
					fileItemEdit.remove();
				}
			}).
			catch(error => {
				Notify.error('error.file_deletion_error');
			});
		}
		return; // Завершаем обработку, чтобы не проверять другие условия
	}
	// Проверяем, был ли клик выполнен на элементе .edit-prew или его дочерних элементах
	const editPrewButton = e.target.closest('.edit-prew');
	if (editPrewButton) {
		e.preventDefault();
		const fileId = editPrewButton.getAttribute('data-file-id');
		if (confirmTranslated('confirm.update_preview')) {
			// AJAX-запрос для обновления превью
			fetch(`/update_preview/${fileId}`, {
					method: 'POST'
				})
				.then(response => {
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}
					return response.json();
				}).then(data => {
					if (data.newPreviewUrl) {
						Notify.success('success.update_preview'); //Превью успешно обновлено
						const imgElement = editPrewButton.closest('.file-item-edit').querySelector('.preview-image');
						if (imgElement) {
							imgElement.src = data.newPreviewUrl; // Обновляем src изображения
						}
					} else {
						Notify.error('error.update_preview');
					}
				}).
			catch(error => {
				Notify.error('error.update_preview');
			});
		}
		return; // Завершаем обработку, чтобы не проверять другие условия
	}
});

// Функция для получения параметров из URL
function getUrlParams() {
	const params = new URLSearchParams(window.location.search);
	return {
		page: parseInt(params.get('page')) || 1,
		// По умолчанию страница 1
		query: params.get('query')?.trim() || '' // Убираем лишние пробелы
	};
}
// Обработчик для ссылки "Все файлы"
document.getElementById('show-all-files').addEventListener('click', function(e) {
	e.preventDefault();
	// Очищаем параметры URL
	updateUrl(1, ''); // Устанавливаем страницу 1 и пустой запрос
	// Очищаем поле поиска
	const queryInput = document.getElementById('query');
	if (queryInput) {
		queryInput.value = '';
	}
	// Загружаем контент для "Все файлы"
	//loadContent('/all_files?page=1');
	loadContent('/all_files?page=1').then(() => {
		initializeBlurMode(); // Инициализируем режим размытия после загрузки контента
	});
});
// Обработчик для ссылки "Редактировать теги"
document.getElementById('edit-tags').addEventListener('click', function(e) {
	e.preventDefault();
	// Очищаем параметры URL
	updateUrl(1, ''); // Устанавливаем страницу 1 и пустой запрос
	// Очищаем поле поиска
	const queryInput = document.getElementById('query');
	if (queryInput) {
		queryInput.value = '';
	}
	// Загружаем контент для "Редактировать теги"
	//loadContent('/edit_tags');
	loadContent('/edit_tags').then(() => {
		initializeBlurMode(); // Инициализируем режим размытия после загрузки контента
	});
});

// Функция для обновления URL
function updateUrl(page, query) {
	const url = new URL(window.location.href);
	url.searchParams.set('page', page); // Устанавливаем номер страницы
	url.searchParams.set('query', query.trim()); // Устанавливаем запрос (или очищаем его)
	window.history.pushState({}, '', url.toString());
}
// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
	// Инициализация темы
	var myCookie = getCookie('DarkThemeFB');
	if (myCookie !== null) {
		var modeSwitch = document.querySelector('.mode-switch');
		var darkIcon = document.getElementById('dark-light');
		document.documentElement.classList.add('dark');
		modeSwitch.classList.add('active');
		darkIcon.classList.remove('fa-sun');
		darkIcon.classList.add('fa-moon');
	}
	// Загружаем статистику при загрузке страницы
	loadStats();
});

//новый
document.addEventListener('click', function (e) {
    // Обработка кликов на теги
    if (e.target.classList.contains('tag')) {
        handleTagClick(e);
    }

    // Обработка кликов на ссылки пагинации
    if (
        e.target.classList.contains('page-link') ||
        e.target.classList.contains('prev') ||
        e.target.classList.contains('next')
    ) {
        handlePaginationClick(e);
    }
});

// Функция для обработки кликов на теги новый
function handleTagClick(e) {
    e.preventDefault();

    const tag = e.target.getAttribute('data-tag'); // Получаем значение тега
    if (!tag) return;

    // Формируем URL для поиска по тегу
    const url = `/search_by_tag?tag=${encodeURIComponent(tag)}&page=1`;

    // Загружаем контент
    loadContent(url).then(() => {
        initializeBlurMode(); // Инициализируем режим размытия после загрузки контента
        up(); // Вызываем функцию up(), если она определена
    });
}



// Функция для обработки кликов на пагинацию
function handlePaginationClick(e) {
    e.preventDefault();

    const pagination = e.target.closest('.pagination');
    if (!pagination) return;

    const route = pagination.getAttribute('data-route');
    if (!route) return;

    // Получаем параметры из href кликнутой ссылки
    const linkUrl = new URL(e.target.href, window.location.origin);
    const params = new URLSearchParams(linkUrl.search);
    
    // Формируем новый URL с учетом текущего маршрута
    const url = `/${route}?${params.toString()}`;
    
    // Обновляем URL в адресной строке
    window.history.pushState({}, '', url);
    
    loadContent(url).then(() => {
        initializeBlurMode();
        up();
    });
}

// Обработчик для формы поиска новый
document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const query = document.getElementById('query').value.trim();

    if (!query) {
        // Если запрос пустой, загружаем все файлы
        loadContent('/all_files?page=1');
        return;
    }

    const url = `/search_by_word?query=${encodeURIComponent(query)}&page=1`;
    
    // Обновляем URL в адресной строке
    window.history.pushState({}, '', url);
    
    loadContent(url).then(() => {
        initializeBlurMode();
        up(); // Если эта функция нужна
    });
});

// Функция для загрузки контента через AJAX
function loadContent(url) {
    return fetch(url) // Возвращаем промис
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('results').innerHTML = html; // Вставляем результаты
        })
        .catch(error => {
            document.getElementById('results').innerHTML =
                '<p>Произошла ошибка при загрузке данных.</p>';
        });
}

document.getElementById('optimize-db').addEventListener('click', function(e) {
	e.preventDefault(); // Предотвращаем стандартное поведение ссылки
	// Отправляем AJAX-запрос на сервер
	fetch('/optimize_db', {
		method: 'POST'
	}).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then(data => {
		Notify.raw('success', data.message);
	}).
	catch(error => {
		Notify.error('error.optimize_db');  //Произошла ошибка при оптимизации базы данных
	});
});

function up() {
	var t;
	var top = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
	if (top > 0) {
		window.scrollBy(0, -100);
		t = setTimeout('up()', 10);
	} else clearTimeout(t);
	return false;
}


document.addEventListener('click', function(e) {
	// Проверяем, был ли клик выполнен на элементе .open-this-file или его дочерних элементах
	const openFileButton = e.target.closest('.open-this-file');
	if (openFileButton) {
		e.preventDefault();
		// Получаем путь к файлу из атрибута data-file-path
		const filePath = openFileButton.getAttribute('data-file-path');
		// Отправляем AJAX-запрос на сервер
		fetch('/open_file', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				file_path: filePath
			})
		}).then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		}).then(data => {
			if (data.error) {
				Notify.raw('error', data.error);
			} else {
				console.log(data.message);
			}
		}).
		catch(error => {
			Notify.error('error.open_file'); //Произошла ошибка при открытии файла
		});
	}
});

let isCopying = false;
document.addEventListener('click', function (e) {
    const copyFileButton = e.target.closest('.copy-this-file');
    if (copyFileButton && !isCopying) {
        isCopying = true; // Блокируем повторные клики
        e.preventDefault();

        const filePath = copyFileButton.getAttribute('data-file-path');

        fetch('/open_directory_dialog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source_path: filePath
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
					Notify.raw('error', `${getTranslation('error.prefix')} ${data.error}`);
					
                } else if (data.message === "Directory selected") {
                   Notify.success('success.copy_file');  //Файл успешно скопирован.
                } else {
                    Notify.error('error.copy_file_reset'); //Операция отменена пользователем
                }
            })
            .catch(error => {
                Notify.error('error.copy_file'); //Произошла ошибка при копировании файла
            })
            .finally(() => {
                isCopying = false; // Разблокируем кнопку после завершения
            });
    }
});
document.addEventListener('click', function(e) {
	// Обработка клика на кнопку "Увеличить"
	const expandButton = e.target.closest('a[data-preview-image]');
	if (expandButton) {
		e.preventDefault();
		// Получаем путь к изображению из атрибута data-preview-image
		const previewImageSrc = expandButton.getAttribute('data-preview-image');
		// Находим элементы preview-window и overlay
		const previewWindow = document.querySelector('.preview-window');
		const overlay = document.querySelector('.overlay');
		const previewImage = previewWindow.querySelector('img');
		if (!previewImageSrc) {
			return;
		}
		// Устанавливаем src для изображения
		previewImage.src = previewImageSrc;
		// Показываем preview-window и overlay (убираем класс hidden)
		previewWindow.classList.remove('hidden');
		overlay.classList.remove('hidden');
	}
	// Обработка клика на кнопку закрытия
	const closeButton = e.target.closest('.close-preview');
	if (closeButton) {
		e.preventDefault();
		// Находим элементы preview-window и overlay
		const previewWindow = document.querySelector('.preview-window');
		const overlay = document.querySelector('.overlay');
		const previewImage = previewWindow.querySelector('img');
		// Очищаем src у изображения
		previewImage.src = '';
		// Скрываем preview-window и overlay (добавляем класс hidden)
		previewWindow.classList.add('hidden');
		overlay.classList.add('hidden');
	}
});

// Функция для загрузки статистики
function loadStats() {
    fetch('/stats')
        .then(response => response.json())
        .then(data => {
            const totalFiles = data.total_files;
            const categories = data.categories;
            const dbSize = data.db_size;
            const totalTags = data.total_tags;
            const top25Tags = data.top_25_tags;

            // Формируем строку для каждой категории
            const videoStats = formatCategoryStats(categories['Видео'], ' <span data-i18n="total.videos">Видео</span>');
            const imageStats = formatCategoryStats(categories['Изображения'], ' <span data-i18n="total.images">Изображения</span>');
            const documentStats = formatCategoryStats(categories['Документы'], ' <span data-i18n="total.docs">Документы</span>');

            // Формируем список топ-25 тегов с количеством записей
            const topTagsHtml = top25Tags.map(tag => `
                <div class="tag" data-tag="${tag.tag}">
                    ${tag.tag} <span>(${tag.count})</span>
                </div>
            `).join('');

            // Выводим результат
            document.getElementById('results').innerHTML = `
                <div class="f-l" style="max-width: 50%;">
                    <p><span data-i18n="div.total_files">Файлов в базе:</span> ${totalFiles} | <span data-i18n="div.db_size">Размер базы данных:</span> ${dbSize}</p>
                    <div class="mt-20">
                        <p>${videoStats}</p>
                        <p>${imageStats}</p>
                        <p>${documentStats}</p>
                    </div>
                </div>
                <div class="f-r" style="max-width: 50%;">
                    <p><span data-i18n="div.total_tags">Всего тегов:</span> ${totalTags} | <span data-i18n="div.top_tags">Самые популярные 25 тегов:</span></p>
                    <div class="tags-container mt-20">${topTagsHtml}</div>
                </div>`;
        })
        .catch(error => {
            document.getElementById('results').innerHTML = '<p>Произошла ошибка при загрузке статистики.</p>';
        });
}

// Вспомогательная функция для форматирования статистики категории
function formatCategoryStats(categoryStats, categoryName) {
	if (!categoryStats || Object.keys(categoryStats).length === 0) {
		return `${categoryName}: 0`;
	}

	const formattedStats = Object.entries(categoryStats)
		.map(([ext, count]) => `${count} ${ext}`)
		.join(' | ');
	return `${categoryName}: ${formattedStats}`;
}

// Функция для обновления списка тегов для конкретного контейнера
function updateTags(tagsListInput, tags) {
	const inputField = tagsListInput.querySelector('.tags-input-text');
	if (!inputField) {
		return;
	}
	// Очищаем текущие теги
	const existingTags = tagsListInput.querySelectorAll('.tags-input-tag');
	existingTags.forEach(tag => tag.remove());
	// Добавляем новые теги
	tags.forEach(tag => {
		if (!tag) {
			return; // Пропускаем пустые или некорректные теги
		}
		const tagElement = document.createElement('span');
		tagElement.className = 'tags-input-tag';
		// Проверяем, является ли тег новым (не сохраненным)
		if (tagsListInput.getAttribute('data-saved-tags') && !tagsListInput.getAttribute('data-saved-tags').split(',').includes(tag)) {
			tagElement.classList.add('grey'); // Добавляем класс grey для новых тегов
		}
		tagElement.setAttribute('data-tag', tag);
		const tagText = document.createElement('span');
		tagText.textContent = tag;
		const removeButton = document.createElement('button');
		removeButton.type = 'button';
		removeButton.className = 'tags-input-remove';
		const icon = document.createElement('i');
		icon.className = 'fas fa-times';
		removeButton.appendChild(icon);
		tagElement.appendChild(tagText);
		tagElement.appendChild(removeButton);
		tagsListInput.insertBefore(tagElement, inputField);
	});
}


// теги
document.addEventListener('DOMContentLoaded', () => {
	const minTagLength = 2;
	
	// Функция для добавления нового тега
	function addTag(tagsListInput, tags, newTag) {
		newTag = newTag.trim().replace(/,$/, ''); // Удаляем запятую в конце, если есть
		if (!newTag) {
			return false; // Пустые теги не добавляем
		}
		if (newTag.length < minTagLength) {
			Notify.error('error.short_tag');
			return false;
		}
		if (!tags.includes(newTag)) {
			tags.push(newTag);
			const inputField = tagsListInput.querySelector('.tags-input-text');
			if (inputField) {
				inputField.value = '';
			}
			// Создаем новый тег с классом grey
			const tagElement = document.createElement('span');
			tagElement.className = 'tags-input-tag grey'; // Добавляем класс grey
			tagElement.setAttribute('data-tag', newTag);
			const tagText = document.createElement('span');
			tagText.textContent = newTag;
			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.className = 'tags-input-remove';
			const icon = document.createElement('i');
			icon.className = 'fas fa-times';
			removeButton.appendChild(icon);
			tagElement.appendChild(tagText);
			tagElement.appendChild(removeButton);
			tagsListInput.insertBefore(tagElement, inputField);
			return true;
		} else {
			Notify.error('error.duplicate_tag');
			return false;
		}
	}
	
	// Инициализация элементов после их динамической подгрузки
	function initializeTagsInput(tagsListInput) {
		const inputField = tagsListInput.querySelector('.tags-input-text');
		if (!inputField) {
			return;
		}
		// Создаем уникальный массив тегов для этого контейнера
		const tags = [];
		// Проверяем, есть ли уже теги в контейнере
		const existingTags = Array.from(tagsListInput.querySelectorAll('.tags-input-tag')).map(tagElement => tagElement.getAttribute('data-tag')).filter(tag => tag && tag.trim()); // Удаляем пустые или некорректные теги
		if (existingTags.length > 0) {
			tags.push(...existingTags);
			tagsListInput.setAttribute('data-saved-tags', existingTags.join(',')); // Сохраняем существующие теги
		} else {
			tags.push('');
			tagsListInput.setAttribute('data-saved-tags', ''); // Устанавливаем начальные теги
		}
		// Обработчик нажатия клавиш в поле ввода
		inputField.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ',') {
				e.preventDefault();
				const inputValue = inputField.value.trim();
				if (inputValue) {
					addTag(tagsListInput, tags, inputValue);
				}
			}
			// Добавляем обработку Backspace для удаления последнего тега
			if (e.key === 'Backspace' && inputField.value.trim() === '') {
				e.preventDefault();
				removeLastTag(tagsListInput, tags);
			}
		});
		// Функция для удаления последнего тега
		function removeLastTag(tagsListInput, tags) {
			if (tags.length > 0) {
				tags.pop(); // Удаляем последний тег из массива
				updateTags(tagsListInput, tags); // Обновляем отображение тегов
			}
		}
		// Обработчик вставки текста
		inputField.addEventListener('paste', (e) => {
		e.preventDefault(); // Предотвращаем стандартную вставку

		const clipboardData = e.clipboardData || window.clipboardData;
		const pastedText = clipboardData.getData('text').trim();

		// Разделяем вставляемый текст по запятым
		const newTags = pastedText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

		// Добавляем каждый тег
		newTags.forEach(tag => {
			addTag(tagsListInput, tags, tag);
		});

		// Очищаем поле ввода
		inputField.value = '';
		});
		// Обработчик удаления тегов
		tagsListInput.addEventListener('click', (e) => {
			if (e.target.closest('.tags-input-remove')) {
				const tagElement = e.target.closest('.tags-input-tag');
				const tagToRemove = tagElement.getAttribute('data-tag');
				const index = tags.indexOf(tagToRemove);
				if (index > -1) {
					tags.splice(index, 1);
					updateTags(tagsListInput, tags);
				}
			}
		});
		// Инициализация начального состояния тегов
		updateTags(tagsListInput, tags);
	}
	// Наблюдатель за динамической подгрузкой элементов
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach(node => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					// Проверяем, является ли добавленный элемент .tags-list-input
					if (node.matches && node.matches('.tags-list-input')) {
						initializeTagsInput(node);
					} else if (node.querySelectorAll) {
						// Проверяем, содержит ли добавленный элемент .tags-list-input
						const tagsListInputs = node.querySelectorAll('.tags-list-input');
						tagsListInputs.forEach(tagsListInput => initializeTagsInput(tagsListInput));
					}
				}
			});
		});
	});
	// Начинаем наблюдение за изменениями DOM
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	// Инициализация уже существующих элементов
	document.querySelectorAll('.tags-list-input').forEach(tagsListInput => {
		initializeTagsInput(tagsListInput);
	});
});

document.addEventListener('DOMContentLoaded', () => {
    // Делегирование событий для .preview-container
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);

    function handleMouseOver(event) {
        // Проверяем, что событие произошло на элементе .preview-image
        const previewImage = event.target.closest('.preview-image');
        if (previewImage) {
            // Находим ближайший .preview-container
            const container = previewImage.closest('.preview-container');
            if (container) {
                // Находим .preview-icon внутри этого контейнера
                const previewIcon = container.querySelector('.preview-icon');
                if (previewIcon) {
                    previewIcon.classList.add('black-text'); // Добавляем класс gold
                }
            }
        }
    }

    function handleMouseOut(event) {
        // Проверяем, что событие произошло на элементе .preview-image
        const previewImage = event.target.closest('.preview-image');
        if (previewImage) {
            // Находим ближайший .preview-container
            const container = previewImage.closest('.preview-container');
            if (container) {
                // Находим .preview-icon внутри этого контейнера
                const previewIcon = container.querySelector('.preview-icon');
                if (previewIcon) {
                    previewIcon.classList.remove('black-text'); // Удаляем класс gold
                }
            }
        }
    }
});