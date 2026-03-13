FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    zip \
    unzip \
    git \
    curl

RUN docker-php-ext-install pdo pdo_mysql

COPY . /var/www/html/

WORKDIR /var/www/html

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer install

RUN php artisan key:generate || true

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000