const { response, request} = require('express');
const Producto = require('../models/producto');
const cloudinary = require('cloudinary').v2;
const Categoria = require('../models/categoria');



const productosGet = async (req=require, res=response) =>{
    const {desde=0, limite = 5} = req.query;
    const query = { estado: true};

    const [total, producto] = await Promise.all([
        Producto.countDocuments(query),
        Producto.find(query)
        .skip(Number(desde))
        .limit(Number(limite))
    .populate('usuario', 'correo')
       .populate('categoria', 'nombre')




    ]);
    res.json({
        msg: 'producto obtenido',
        total,
        producto
    });
}


 const productoGet = async (req = request, res = response) => {
    const { id } = req.params;

    const producto = await Producto.findById(id)
        .populate('usuario', 'nombre')
        .populate('categoria', 'nombre');

    res.json({
        msg: "el producto obtenido según lo solicitado",
        producto
    });
};


const productoPost = async (req = request, res = response) => {
    const { precio, categoria, descripcion, img, stock } = req.body;
    const nombre = req.body.nombre.toUpperCase();
    const productoDB = await Producto.findOne({ nombre })

    //Subir imagen a Cloudinary
    const imagen = async (img) => {
        try {
            // Upload the image
            const result = await cloudinary.uploader.upload(img);
            return result.secure_url;
        } catch (error) {
            console.error(error);
        }
    };
    const imgId = await imagen(img);

    //Validar si el producto existe
    if (productoDB) {
        return res.status(400).json({
            msg: `El producto ${productoDB.nombre} ya existe.`,
        })
    }

    //Generar la data que voy a guardar en la DB
    const data = { nombre, categoria, precio, descripcion, img: imgId, stock, usuario: req.usuario._id }

    const producto = new Producto(data);

    //Grabar en la DB
    await producto.save();

    res.status(201).json({
        msg: 'Producto creado con éxito!',
        producto,
    })
}


const productoPut = async (req = request, res = response) => {
    const { id } = req.params;
    const { precio, categoria, descripcion, destacado, img, stock } = req.body;

    const usuario = req.usuario._id;  

    let data = { precio, descripcion, categoria, destacado, stock, usuario };

    // si viene nombre
    if (req.body.nombre) {
        data.nombre = req.body.nombre.toUpperCase();
    }

    // si viene nueva imagen
    if (img) {
        const productoActual = await Producto.findById(id);
        if (productoActual.img) {
            const nombreArr = productoActual.img.split('/');
            const nombre = nombreArr[nombreArr.length - 1];
            const [public_id] = nombre.split('.');
            await cloudinary.uploader.destroy(public_id);
        }

        const result = await cloudinary.uploader.upload(img);
        data.img = result.secure_url;
    }

    const producto = await Producto.findByIdAndUpdate(id, data, { new: true });

    res.status(201).json({
        msg: 'El producto se actualizó',
        producto
    });
};



const productoDelete = async (req=request, res=response) =>{
const {id} = req.params;

const productoInactivo = await Producto.findByIdAndUpdate(id, {estado: false}, {new:true});

res.json({
    msg:`el producto ${productoInactivo.nombre} se inactivo`,
    productoInactivo
})
}



module.exports ={
    productoPost,
    productoGet,
    productosGet,
    productoDelete,
    productoPut,
}