package main

import (
	"flag"
	"io/fs"
	"log"
	"net/http"
)

type unionFS []http.FileSystem

func (ufs unionFS) Open(name string) (http.File, error) {
	var lastErr error
	for _, fs := range ufs {
		f, err := fs.Open(name)
		if err == nil {
			return f, nil
		}
		lastErr = err
	}
	if lastErr == nil {
		lastErr = fs.ErrNotExist
	}
	return nil, lastErr
}

func main() {
	flag.Parse()

	var ufs unionFS
	ufs = append(ufs, http.Dir("."))
	for _, path := range flag.Args() {
		ufs = append(ufs, http.Dir(path))
	}

	http.Handle("/", http.FileServer(ufs))

	log.Println("Listening on :8000...")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
