package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gustavares/event-queue/app/datastore"
)

type RootHandler struct{}

func (rh *RootHandler) health(w http.ResponseWriter, r *http.Request) {
	log.Println("OK")
	w.WriteHeader(http.StatusOK)
	return
}

type AuthHandler struct {
	userDs datastore.UserDatastore
}

func (a *AuthHandler) requestPasscode(w http.ResponseWriter, r *http.Request) {
	type RequestPasscodeBody struct {
		Email string `json:"email"`
	}

	var rp RequestPasscodeBody
	err := json.NewDecoder(r.Body).Decode(&rp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// TODO: Validate user Email
	user, err := a.userDs.GetByEmail(rp.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "user not found for email: "+rp.Email, http.StatusNotFound)
		return
	}

	// TODO: generate passcode
	// send email

	w.WriteHeader(http.StatusOK)
}

func NewAuthHandler(userDs datastore.UserDatastore) *AuthHandler {
	return &AuthHandler{
		userDs,
	}
}

type Handlers struct {
	mux  *http.ServeMux
	Auth *AuthHandler
	Root *RootHandler
}

func (h *Handlers) authRouter() {
	h.mux.HandleFunc("POST /auth/request-passcode", h.Auth.requestPasscode)

	log.Println("/auth initialized")
}

func (h *Handlers) rootRouter() {
	h.mux.HandleFunc("GET /health", h.Root.health)

	log.Println("/ initialized")
}

func (h *Handlers) RegisterRoutes() *http.ServeMux {
	h.authRouter()
	h.rootRouter()

	return h.mux
}

func NewHandlers(ds *datastore.Datastore) *Handlers {
	log.Println("Initializing routers")
	mux := http.NewServeMux()

	return &Handlers{
		mux:  mux,
		Auth: NewAuthHandler(ds.User),
		Root: &RootHandler{},
	}
}
