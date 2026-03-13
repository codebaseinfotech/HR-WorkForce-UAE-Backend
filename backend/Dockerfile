FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    zip \
    unzip \
    git \
    curl

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/html

COPY backend/ /var/www/html/

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer install --no-dev --optimize-autoloader

RUN php artisan key:generate || true

EXPOSE 10000

CMD php artisan migrate --force && \
    php artisan db:seed --force || true && \
    php artisan serve --host=0.0.0.0 --port=10000