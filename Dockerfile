
# Install node v10
FROM node:10

# Set the workdir /var/www/app
WORKDIR /var/www/app

# Copy the package.json to workdir
COPY package.json ./

# Run npm install - install the npm dependencies
RUN npm install

# Copy application source
COPY . .

# # Copy .env.docker to workdir/.env - use the docker env
# COPY .env.docker ./.env

# Expose application ports - (4300 - for API and 4301 - for front end)
EXPOSE 4300 5000

# Generate build
#RUN npm run build

# Start the application
CMD ["npm", "run", "start"]