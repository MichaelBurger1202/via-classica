Via Classica v13.11 — source-task architecture fix + repetitio

Цель релиза
- Исправлена архитектура source-задач перед дальнейшим встраиванием реального банка.
- Metadata-only задания больше не считаются готовыми к учебной выдаче.
- Текст встроенного source-задания хранится только в структурированных plain-text полях и проходит через общий wordHtml(), поэтому видимые английские слова могут добавляться в словарь тем же механизмом, что и обычные задания.

Новая структура content
{
  "content": {
    "instructions": "...",
    "context": "...",
    "passage": "...",
    "prompt": "...",
    "options": ["...", "...", "..."]
  }
}

Правила
1. source-mcq: content.options обязателен; answerFormat=letter или text.
2. source-input: accepted обязателен; prompt/passage/context могут содержать текст с кликабельными словами.
3. Если source-запись не имеет проверенного content, active автоматически становится false. Такая запись остаётся в каталоге, но не попадает в AI/manual picker.
4. Неиспользуемый внешний source-only fallback не маскируется под встроенное задание.
5. Никакой генерации текста задания и никаких придуманных answer keys.
6. Все отображаемые части встроенного английского задания (instructions/context/passage/prompt/options) используют wordHtml().

Дополнительно
- Восстановлены renderTask/renderManualTask, которых не было в предыдущем v13.9.2-файле.
- Retry использует тот же renderer, поэтому словарь и source-content не расходятся между первой и повторной попыткой.
- PWA/cache/query versions подняты до 13.11.

Статус банка
Текущий банк из предыдущего архива не изменён по содержанию: его source-записи пока metadata-only. Поэтому они намеренно НЕ становятся активными до следующего этапа — реального встраивания проверенного текста.


Repetitio pass (post-release):
- Fixed picker eligibility: active=false/source-not-ready records can no longer enter AI or manual training.
- Fixed sourceReady: an input source task is not ready unless it has actual visible embedded content.
- Fixed AI session resume: currentTaskId is reused when still eligible.
- Normalized English history/dictionary/profile containers against malformed localStorage shapes.
- Updated service-worker registration query to v13.11.


Repetitio 10-cycle update
- Adaptive picker now actually changes selection direction: repeated errors prefer lower-difficulty eligible tasks; sustained success prefers higher-difficulty eligible tasks.
- The 1281-record source catalog is not equivalent to 1281 ready tasks: 920 IELTS UP records currently contain source metadata without embedded content/verified answer data and remain inactive.
- Records are never activated merely because a source URL or question identifier exists.
