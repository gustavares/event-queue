FROM node:22-alpine

# Set up PNPM_HOME and add it to PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Install Expo CLI globally
RUN pnpm add -g expo-cli

COPY . .

# Install dependencies
RUN pnpm install

# Expose the default Expo development server ports
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
EXPOSE 8081

# Set environment variable to allow connections from all network interfaces
ENV HOST=0.0.0.0

# Start the Expo development server
CMD ["pnpm", "dev", "--", "--lan"]
