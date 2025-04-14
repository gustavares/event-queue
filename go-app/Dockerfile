FROM golang:1.23.4

WORKDIR /app

RUN go install github.com/githubnemo/CompileDaemon@latest
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.16.0/migrate.linux-amd64.tar.gz | tar xvz && mv migrate /usr/local/bin/

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /main .

EXPOSE 8080

# Run the app with CompileDaemon for hot reloading
# CMD ["CompileDaemon", "--build=main.go", "--command=./main"]
# CMD ["CompileDaemon", "--directory=/app", "--command=./main"]
CMD ["CompileDaemon", "--command=./event-queue"]

# CMD ["./event-queue"]

