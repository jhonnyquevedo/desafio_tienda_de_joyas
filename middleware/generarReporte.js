const generarReporte = (req, res, next) =>{
    const url = req.url
    const query = req.query
    console.log(`Se ha recibido una consulta a la ruta ${url}, con la siguiente query`, query)
    next()
}
module.exports = {generarReporte}