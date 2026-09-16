Via Classica v13.12

Дата: 2026-09-16

Цель релиза
- Перевести English source bank из «скрытого каталога» в прозрачную source-bank архитектуру.
- Не считать metadata-only записи встроенными заданиями.
- Добавить каталог источников внутри приложения и официальный FIPI Navigator 2026.
- Сохранить строгий запрет на выдумывание текста/ответов.

Состояние банка
- 1281 source records.
- Автоматически оцениваемых embedded records: 0.
- Все metadata-only записи остаются вне AI-тренировки.
- Ответы без подтверждённого ключа не добавляются.

Источники
- FIPI Open Bank / Navigator 2026.
- IELTS.org official sample resources.
- Cambridge English official preparation resources.
- IELTS UP — только как внешний source-link, без угадывания ответов.
- British Council / Oxford — source/reference layer.

Ограничение
Встроить весь текст защищённых сторонних Cambridge/IELTS материалов без проверки разрешения нельзя. Поэтому v13.12 делает корректный source-link режим и не выдаёт ссылку/ID за встроенное задание. Для FIPI также требуется прямое извлечение и проверка содержимого каждого задания перед activation.

FIPI Navigator
См. fipi-navigator-2026.json. IDs из Navigator не считаются полноценными задачами автоматически.

Следующий технический шаг
Только после получения разрешённого/проверенного содержимого: добавить content + answer, прогнать validation, активировать записи, затем end-to-end repetitio.
