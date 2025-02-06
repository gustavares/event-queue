package api

type RootHandler struct{}

type Handlers struct {
	Root RootHandler
}

func (h *Handlers) rootRouter() {

}

func NewHandlers() *Handlers {
	return &Handlers{}
}
