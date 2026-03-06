1. Create a folder, e.g. helloworldnodeapi
2. Run cd helloworld
3. Run npm init -y ---> this will create package.json
4. Create a file named server.js and add below content
    const express = require("express");
    const app = express();
    const port = process.env.PORT || 3000;

    app.get("/", (req, res) => {
        res.send("Hello World from SAP BTP!");
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
5. Run npm install express ---> this is install express
6. Update package.json
    
    "scripts": {
        "start": "node server.js"
    }
7. Create a file named manifest.yml and add below code

    applications:
    - name: helloworld-api
      random-route: true
      memory: 256M
      buildpacks:
        - nodejs_buildpack

8. cf login
9. cf push


