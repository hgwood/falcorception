# falcorception

Falcorception est une webapp qui permet de créer, modifier, et déployer 
des API Falcor de manière graphique. Elle est elle-même basée sur une API
Falcor.

Une API Falcor est une collection de routes, de la même manière que API
Rest et une collection de ressources. Une route est une sorte de regex
pour matcher des chemins dans un objet JSON (ex `a.b[{keys}].d` matche
`a.b.c.d` et `a.b.e.d`) et une fonction qui pour les chemins effectivement
demandés donne des valeurs pour ces chemins. Falcorception ne permettra
pas de donner du code pour ces fonctions, mais on pourra dire "une route
avec le pattern X fait une requête Y sur la source de données Z".
Exemples de Z : une base SQL, une base Mongo, fichier CSV, API Rest...
tout ce qu'on peut trouver. Y dépend bien sûr de Z : une requête SQL, une
requête Mongo, une requête HTTP...Donc pour l'instant j'ai imaginé qu'on
aurait un écran pour lister les API, un autre pour lister les routes d'une
API, un 3e pour configurer une route, et un 4e pour configurer les sources.

Pour être plus précis, une route Falcor regroupe le pattern et jusqu'à 3
fonctions. Ce que j'ai décris au paragraphe précédent est le `get`, qui
retourne des données. Il y a aussi le `set` et le `call`. Une route peut
ou pas implémenter un handler pour chaque méthode. Falcorception doit
avant tout permettre les gets. On verra ensuite pour les sets, et enfin
les calls.

## Parallèle Rest / Falcor

Rest | Falcor
-----|-------
Ressource | Valeur
URI | path JS
GET | get
PUT | set
POST | call
`app.get("/users/:id", (req, res) => {})` | `{route: "users[{keys:ids}]", get(pathSet) {}}`
`app.put("/users/:id", (req, res) => {})` | `{route: "users[{keys:ids}]", set(pathSet) {}}`
`$http.get("/users/42")` | `model.get("users[42]")`
Multi get: impossibru | `model.get("users[42, 44, 180]", "companies[108]['id', 'name']")`

Falcor permet au client de demander autant de paths qu'il le désire à
la fois. Il peut donc avoir tout ce qu'il veut et seulement ce qu'il veut
en une seule requête, et sans endpoint spécifique. Là est la magie.

## Gotchas

- Don't forget to `bodyParser.urlencoded({extended: false})` so that falcor 
can interpret form data coming from the client, otherwise you get `Request 
not supported` on calls.

- When the falcor client retries multiple times until an error is raised,
that means the server is returning invalid paths.

- The falcor clients will replace value at paths not returned by the 
server by atoms.
