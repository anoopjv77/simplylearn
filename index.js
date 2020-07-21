var express                                 =   require('express'),
    app                                     =   express(),
    http                                    =   require('http').Server(app),
    io                                      =   require('socket.io')(http),
    bodyParser                              =   require("body-parser"),
    multer                                  =   require("multer"),
    mongoose                                =   require("mongoose"),
    moment                                  =   require("moment"),
    path                                    =   require('path'),
    fs                                      =   require('fs-extra'),
    {userJoin,getCurrentUser,userLeave}     =   require("./utils/users"),
    teacherSchema                           =   require("./models/teacher");

mongoose.connect("mongodb://localhost:27017/simplylearn", { useNewUrlParser: true });
mongoose.set('useFindAndModify', false);    

var storage = multer.diskStorage({
    destination: function(req,file,cb){
        let name = req.body.name;
        let path = './uploads/'+name;
        fs.mkdirsSync(path);
      cb(null,path);
    },
    filename: function(req,file,cb){
      cb(null,file.originalname);
    }
  });
  var fileFilter = function(req,file,cb){
    if(file.mimetype ==='image/png' || file.mimetype==='image/jpeg'){
      cb(null,true);
    }
    else{
      cb(null,false);
    }
  }
  var uploads = multer({
    storage:storage, limits:{
    fieldSize: 1024*1024*5
    },
    fileFilter:fileFilter
  });
  

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use('/uploads',express.static('uploads'));
app.use(express.static(path.join(__dirname,"views")));


const PORT = process.env.PORT || 1690   

app.get("/",function(req,res){
    res.render("index");
});

app.get("/teacher",function(req,res){
    res.render("teacher");
});

app.get("/student",function(req,res){
    res.render("student");
});

app.get("/info",function(req,res){
    res.render("info");
});

app.post("/teacher",uploads.array("pptimages",25),function(req,res){
    var newTeacher = teacherSchema();
    newTeacher.name = req.body.name;
    newTeacher.classname = req.body.classname;
    req.files.forEach(function(file){
        newTeacher.pptimages.push(file.path);
    });
    newTeacher.save(function(err,savedata){
        if(err){
            console.log(err);
            res.redirect("/teacher");
        }
        else{

            res.redirect("/teacher/"+savedata._id);
        }
    })
});

app.get("/teacher/:id",function(req,res){
    teacherSchema.findById(req.params.id,function(err,data){
        if(err){
            console.log(err);
            res.redirect("/teacher");
        }
        else{
            console.log(data);
            res.render("linkshare",{data:data});
        }
    });
});

app.get("/session/:id/teacher",function(req,res){
    teacherSchema.findById(req.params.id,function(err,data){
        if(err){
            console.log(err);
            res.redirect("/teacher");
        }
        else{
            res.render("presentation-page-teacher",{data:data});
        }
    });
});

app.get("/session/:id",function(req,res){
    teacherSchema.findById(req.params.id,function(err,data){
        if(err){
            console.log(err);
            res.redirect("/teacher");
        }
        else{
            res.render("presentation-page-student",{data:data});
        }
    });
});

io.on('connection',function(socket){
    socket.on('joinRoom',({room})=>{
        const user = userJoin(socket.id, room);
        socket.join(user.room);
      })

      socket.on('currentslide',n =>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('changeslide',n);

      })

    socket.on('disconnect',()=>{
        userLeave(socket.id);
      })
})
server=http.listen(PORT,function(){
    console.log("Runnning on 1690");
});
