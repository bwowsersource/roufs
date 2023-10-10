const fs = require('fs');
const path = require('path');

const httpMethods = ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'];
function getMethodFromName(filename) {
    const isNamedByMethod = httpMethods.some(name => (new RegExp(`^${name}.(t|j)s$`)).test(filename))
    if (isNamedByMethod) return filename.replace(/.(t|j)s$/, '');
    return null;
}
// basePath == `/controllers`
// urlPath == '/api/home'
// fsPath = `/controllers/api/home`
// entity == `home`

function readControllers(basePath, urlPath) {
    const fsPath = path.resolve(basePath, urlPath)
    const entities = fs.readdirSync(fsPath);
    console.log(fsPath, basePath, urlPath)
    const partialHandlerMappings = entities.map(entity => {
        const entitypath = path.resolve(fsPath, entity);
        console.log(  "=>", entitypath, entity)
        const stat = fs.lstatSync(entitypath);
        // `/controllers/home/GET.js` => 'GET /home'
        // `/controllers/home/index.js exports {GET()} or default-export()` => 'GET /home'
        // `/controllers/home.js exports {GET()} or default-export()` => 'GET /home'


        if (stat.isFile()) {
            const methodName = getMethodFromName(entity)
            // method-leaf
            if (methodName)
                return { [urlPath]: { [methodName]: require(entitypath) } }
            // path-leaf
            const handlers = require(entitypath);
            let defaultHandler = typeof handlers === "function" ? handlers : undefined
            const { GET, POST, DELETE, PATCH, PUT } = httpMethods.reduce((aggr, method) => {
                return { ...aggr, [method]: handlers[method] || defaultHandler }
            }, {})
            const entityUrlSegment = entity.replace(/\.(t|j)s$/, '')
            let pathToMatch = path.join(urlPath, entityUrlSegment === "index" ? '' : entityUrlSegment).replace('\\','/');
            return { [pathToMatch]: { GET, POST, DELETE, PATCH, PUT } }
        } else if (stat.isDirectory()) {
            const mapping = readControllers(basePath, path.join(urlPath, entity))
            return mapping; // Object.entries(mapping).map(([url, handlers]) => ({ path: url, handlers }))
        };
    });
    // console.log("routeTree", partialHandlerMappings)
    // merge keys
    return partialHandlerMappings.reduce((aggr, val) => {
        Object.entries(val).forEach(([pathStub, handlers]) => {
            const normalizedPathStub = path.sep === "\\" ? pathStub.replaceAll(path.sep,'/') : pathStub;
            const existingHandlers = aggr[normalizedPathStub] || {};
            aggr[normalizedPathStub] = { ...existingHandlers, ...handlers }
        });
        return aggr;
    }, {})
}


function findHandler(routeMap, method, path) {
    path = path === '/' || !path ? './' : path;
    // console.log(method, path)
    const matchedPath = Object.keys(routeMap).find(pathDefinition => {
        pathDefSegments = pathDefinition.split('/').map((segment) => {
            const [_, param] = segment.match(/^\[(.*)\]$/) || [];
            if (!param) return segment;
            return { paramName: param }
        });
        pathSegments = path.split('/').filter((seg, pos) => seg || pos); // filterout 1st null segment. This is caused be leading '/' 
        // console.log(pathDefSegments, pathSegments)
        if (pathDefSegments.length != pathSegments.length) return false;
        return pathDefSegments.every((definedSegment, pos) => {
            if (typeof definedSegment === "object") return definedSegment.value = pathSegments[pos]
            if (pathSegments[pos].toLowerCase() === definedSegment.toLowerCase()) return true;
        })
    })
    console.log('matchedPath', matchedPath, routeMap[matchedPath])
    if (!matchedPath) return null;
    return {
        handler: routeMap[matchedPath][method], params: pathDefSegments.reduce((aggr, seg) => {
            if (typeof seg === "string") return aggr;
            return { ...aggr, [seg.paramName]: seg.value }
        }, {})
    };
}
function loadRoutesFrom(routesDir) {
    const routeMap = readControllers(routesDir, './');
    console.log("===",routeMap)
    return (method, path) => findHandler(routeMap, method, path);
}
// module.exports = loadRoutesFrom;
module.exports = routesDir => {
    const router = loadRoutesFrom(routesDir);
    return (req, res, next) => {
        const match = router(req.method, req.path);
        if (!match) return next();
        const { handler, params } = match;
        req.params = params;
        return handler(req, res, next)
    }
};

// tests

// const router = loadRoutesFrom('./src/utils/routestest')
// const { handler, params } = router('GET', '/books/dsad');
// console.log(handler({ params }))