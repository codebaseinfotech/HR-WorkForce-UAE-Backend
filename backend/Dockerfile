FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    zip \
    unzip \
    git \
    curl \
    libpq-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg

RUN docker-php-ext-install \
    gd \
    zip \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    pgsql

WORKDIR /var/www/html

COPY backend/ /var/www/html/

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 10000

CMD sh -c "\
php artisan optimize:clear && \
php artisan config:clear && \
php artisan cache:clear && \
php artisan route:clear && \
php artisan view:clear && \
php artisan storage:link || true && \
php artisan migrate --force || true && \
php artisan db:seed --force || true && \
php artisan config:cache || true && \
php artisan route:cache || true && \
php artisan view:cache || true && \
php artisan serve --host=0.0.0.0 --port=10000"