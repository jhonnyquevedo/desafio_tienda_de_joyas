const { pool  } = require('./variables')

const express = require("express")


const { generarReporte } = require("./middleware/generarReporte")

const app = express()

app.listen(3000, ()=> console.log ("Servidor encendido"))



app.get("/joyas", generarReporte, async (req, res) =>{
    try {
        const {limits, page, order_by} = req.query;
        let consultas  = "";
        if(order_by) {
            const [campo, ordenamiento] = order_by.split("_");
            consultas += ` ORDER BY ${campo} ${ordenamiento}`;
        }
        if(limits){
            consultas += ` LIMIT ${limits}`;
        }
        if(page && limits){
            const offset = (page*limits)-limits;
            consultas += ` OFFSET ${offset}`;
        }

        const query = `SELECT * FROM inventario ${consultas};`;
        const {rows: joyas} = await pool.query(query);
        
        const results = joyas.map(joya => {return{
            name: joya.nombre,
            href: `/joyas/joya/${joya.id}`
        }});

        const totalJoyas = joyas.length
        const stockTotal = joyas.reduce((acumulador, valorActual)=> acumulador + valorActual.stock,0);
        const HATEOAS = {results, totalJoyas, stockTotal};
        res.json(HATEOAS)

    } catch (error) {
        res.status(500).send(error)
    }
})

app.get("/joyas/joya/:id", async (req, res) =>{
    try {
        const {id} = req.params;
        const query = `SELECT * FROM inventario WHERE id = $1`;
        const values = [id];
        const {rows: data} = await pool.query(query, values);
        res.json(data)
    } catch (error) {
        res.status(500).send(error)
    }
})

app.get("/joyas/filtros", generarReporte, async (req, res) =>{
    try {
        const {precio_max, precio_min, metal, categoria} = req.query
        let filtros = []
        const values = []
        const agregarAlFiltro = (campo, comparador, valor) =>{ // campo = id, comparador = "=", valor = 1
            values.push(valor)
            const posicion = filtros.length + 1
            filtros.push(`${campo} ${comparador} $${posicion}`)
        }
        if(precio_max) {
            agregarAlFiltro("precio", "<=", precio_max)
        }
        if(precio_min) {
            agregarAlFiltro("precio", ">=", precio_min)
        }
        if(categoria) {
            agregarAlFiltro("categoria", "=", categoria)
        }
        if(metal) {
            agregarAlFiltro("metal", "=", metal)
        }
        
        // SELECT * FROM inventario WHERE categoria = anillo AND metal = oro;
        const nuevosFiltros = filtros.join(" AND ");
        
        const query = `SELECT * FROM inventario WHERE ${nuevosFiltros}`;

        //console.log(query, values)
        const {rows: data} = await pool.query(query, values);
        res.json(data);
    } catch (error) {
        res.status(500).send(error)
    }
})

app.get("*", (_, res)=> { // Se coloca "_" ya que no se está utilizando "req"
    res.status(404).send("esta ruta no existe")
})

// ejemplo de consultas
//http://localhost:3000/joyas?limits=2&order_by=precio_ASC&page=3

//http://localhost:3000/joyas/filtros?metal=oro&categoria=collar