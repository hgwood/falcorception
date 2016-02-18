# falcorception

## Stuff

- Don't forget to `bodyParser.urlencoded({extended: false})` so that falcor 
can interpret form data coming from the client, otherwise you get `Request 
not supported` on calls.

- When the falcor client retries multiple times until an error is raised,
that means the server is returning invalid paths.

- The falcor clients will replace value at paths not returned by the 
server by atoms.
