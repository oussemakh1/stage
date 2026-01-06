# Use PHP 8.3 Apache as base image
FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Increase PHP memory limit
RUN echo 'memory_limit = 256M' > /usr/local/etc/php/conf.d/memory.ini

# Set working directory
WORKDIR /var/www/html

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy package files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Run post autoload dump scripts
RUN composer run-script post-autoload-dump

# Copy .env.example to .env if .env doesn't exist
RUN cp -n .env.example .env || true

# Generate application key if not set
RUN php artisan key:generate --no-interaction

# Build the frontend
RUN npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Change Apache document root to public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/apache2.conf

# Expose port 80
EXPOSE 80

# Default command
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=80"]
