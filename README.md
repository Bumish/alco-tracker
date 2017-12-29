Alcolytics Tracker принает данные по http, обогащает данным из дополнительных сервисов,
записывает их в кликхаус, отправляет во внешние сервисы.

# Основные вощможности

- Получение данных по http от браузерного трекера [alcojs](https://github.com/alcolytics/alcojs)
- Определение гео на базе ip адреса при помощи [alco-geoip-sypex](https://github.com/alcolytics/alco-geoip-sypex)
- Определение девайса по User-agent при помощи [alco-devicedetector ](https://github.com/alcolytics/alco-devicedetector)
- Запись данных в Yandex ClickHouse
- Передача данных в MixPanel

# Перед запуском

У вас должны быть запущены геокодинг и разбиратель user-agent

# Запуск в docker

Создаем образ

    docker build -t alcolytics/alco-tracker .
    
Запускаем контейнер
    
    docker run -d \
       --name alco-tracker \
       --hostname=alco-tracker \
       --restart=always \
       --net alconet \
       --env SXGEO_SERVICE=172.17.0.1:8087 \
       --env DEVICED_SERVICE=172.17.0.1:8086 \
       --env CH_DSN=http://172.17.0.1:8123/alcolytics \
       -p 8081:8080 \
       -v /srv/upload_ch:/usr/src/app/upload_ch \
       alcolytics/alco-tracker

# Запись данных в ClickHouse

Данные при получении приводятся в формат схемы БД, затем пишутся в файл. Раз в несколько секунд заменяется файл,
в который производится запись. Старый файл отправляется в кликхаус, при успешной записи удаляется, в противном случае
остается лежать до тех пор, пока до него не дойдет очередь на ручную обработку.
Файлы записываются в директорию контейнера /usr/src/app/upload_ch

# Поддерживаемые переменные окружения


    SXGEO_SERVICE=host:port
    DEVICED_SERVICE=host:port
    MIXPANEL_TOKEN=mixpanel_project_token
    CH_DSN=http://host:8123/db_name
    PORT=8080


# Development окружение

- Подсунуть библиотечку в alcojs

# Production запуск

- Запускается из docker, делает все необходимые операции
