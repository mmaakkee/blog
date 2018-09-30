/**
 * Created by Administrator on 2018/8/27.
 */
var express=require("express");
var mysql=require("mysql");

//配置数据库连接池
var pool = mysql.createPool({
    host:"127.0.0.1",
    port:3306,
    database:"blog",
    user:"root",
    password:"a"
});

//路由操作第一步，需要加载路由
var router=express.Router();

router.use(function(req,res,next){
    //console.log(req.session.userInfo);
    if(req.session.userInfo == null || req.session.userInfo == undefined || req.session.userInfo.isAdmin==0){
        res.send("<script>alert('非法操作，请先登录');location.href='http://127.0.0.1/'</script>");
        return;
    }
    next();
});

//第二步，处理请求
router.get("/",function(req,res){
    res.render("admin/index",{
        userInfo: req.session.userInfo
    });
});

//用户首页的请求
router.get("/user",function(req,res){
   var page=Number ( req.query.page || 1 );     //当前的类型，默认为1    1代表首页
    var size=6;         //我们规定，一次默认分6条数据
    pool.getConnection(function(err,conn){
        conn.query("select * from user order by uid",function(err,result){
            if(err){
                console.log(err);
            }
            var count=result.length;         //总记录条数
            var pages=Math.ceil ( count/size );     //计算总页数
            //要控制一下页数
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var beginSize=( page-1 )*size;      //开始的条数

            //开始分页查询
            conn.query("select * from user order by uid limit ?,?",[beginSize,size],function(err,result2){
                //释放链接
                conn.release();
                res.render("admin/user_index", {
                    page: page,
                    pages: pages,
                    size: size,
                    count: count,
                    users:result2,
                    tag:'user',
                    userInfo:req.session.userInfo   //取session
                });
            });
        });
    });
});

//分类首页
router.get("/category",function(req,res){
    var page=Number ( req.query.page || 1 );     //当前的类型，默认为1    1代表首页
    var size=6;         //我们规定，一次默认分6条数据
    pool.getConnection(function(err,conn){
        conn.query("select * from type order by tid",function(err,result){
            if(err){
                console.log(err);
            }
            var count=result.length;         //总记录条数
            var pages=Math.ceil ( count/size );     //计算总页数
            //要控制一下页数
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var beginSize=( page-1 )*size;      //开始的条数

            //开始分页查询
            conn.query("select * from type order by tid limit ?,?",[beginSize,size],function(err,result2){
                //释放链接
                conn.release();
                res.render("admin/category_index", {
                    page: page,
                    pages: pages,
                    size: size,
                    count: count,
                    types:result2,
                    tag:'category',
                    userInfo:req.session.userInfo   //取session
                });
            });
        });
    });
});

//修改类型
router.post("/category/edit",function(req,res){
   var tid=req.body.tid;
    var tname=req.body.tname;
    pool.getConnection(function(err,conn){
        conn.query("update type set tname=? where tid=?",[tname,tid],function(err,result){
            conn.release();
            if(err){
                console.log(err);
            }else if(result.affectedRows>0){    //affectedRows受影响的行
                res.send("1");
            }else{
                res.send("0");
            }

        })
    })
});

//删除类别
router.post("/category/del",function(req,res){
    var tid=req.body.tid;
    var flag=false;
    pool.getConnection(function(err,conn){
        conn.query("select * from contents where tid=?",[tid],function(err,resu){
            if(err){
                console.log(err);
            }else if(resu.length>0){
                //意味着这个tid在contents有数据，不能删除
                //这个时候，想要删除，那么，就要所有的内容的为tid的数据，转换为首页的数据
                conn.query("update contents set tid=1 where tid=?",[tid],function(err,re){
                    conn.query("delete from type where tid=?",[tid],function(err,result){
                        conn.release();
                        if(err){
                            console.log(err);
                        }else if(result.affectedRows>0){    //affectedRows受影响的行
                            res.send("1");
                        }else{
                            res.send("0");
                        }
                    });
                });
            }else{
                //要删除，可以，但是数据，不能在contents里面
                conn.query("delete from type where tid=?",[tid],function(err,result){
                    conn.release();
                    if(err){
                        console.log(err);
                    }else if(result.affectedRows>0){    //affectedRows受影响的行
                        res.send("1");
                    }else{
                        res.send("0");
                    }
                });
            }
        });
    });
});

//添加类型
var msg={
    code:-1,
    message:""
};
router.get("/category/add",function(req,res){
   res.render("admin/category_add",{
        userInfo:req.session.userInfo
    })
});

//添加类别
router.post("/category/add",function(req,res){
    var tname=req.body.tname;
    pool.getConnection(function(err,conn){
       conn.query("insert into type values(0,?)",[tname],function(err,result){
           conn.release();
           if(err){
               console.log(err);
               msg.code=0;
               msg.message="类名不可重复";
               res.json(msg);
           }else{
               msg.code=1;
               msg.message="添加成功";
               res.json(msg);
           }
       });
    })
});

//内容首页
router.get("/content",function(req,res){
    var page=Number ( req.query.page || 1 );     //当前的类型，默认为1    1代表首页
    var size=6;         //我们规定，一次默认分6条数据
    pool.getConnection(function(err,conn){
        conn.query("select * from contents",function(err,result){
            if(err){
                console.log(err);
            }
            var count=result.length;         //总记录条数
            var pages=Math.ceil ( count/size );     //计算总页数
            //要控制一下页数
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var beginSize=( page-1 )*size;      //开始的条数
            //开始分页查询
            conn.query("select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid order by cid limit ?,?",[beginSize,size],function(err,result2){
                //释放链接
                conn.release();
                res.render("admin/content_index", {
                    page: page,
                    pages: pages,
                    size: size,
                    count: count,
                    contents:result2,
                    tag:'content',
                    userInfo:req.session.userInfo   //取session
                });
            });
        });
    });
});

//内容删除
router.post("/content/del",function(req,res){
    var cid=req.body.cid;
    pool.getConnection(function(err,conn){
        conn.query("delete from contents where cid=?",[cid],function(err,result){
           if(err){
               console.log(err);
           }
            if(result.affectedRows>0){
                res.send("1");
            }else{
                res.send("0");
            }
        });
    })
});

//内容的修改
router.get("/content/edit",function(req,res){
    var cid=req.query.cid;
    pool.getConnection(function(err,conn){
        conn.query("select * from type order by tid",function(err,resu){
            conn.query("select c.*,t.tname from contents c,type t where c.tid=t.tid and c.cid=?",[cid],function(err,result){
                conn.release();
                if(err){
                    console.log(err);
                }
                res.render("admin/content_edit",{
                    userInfo:req.session.userInfo,
                    content:result[0],
                    types:resu
                })
            });
        });

    })
});

//修改
router.post("/content/edit",function(req,res){
    //这个数据是在网址上面的，所以要用query
   var cid=Number(req.query.cid);
    //剩下的数据，都是通过form表单提交的，所以用body
    var tid=Number(req.body.category);      //form表单提交，键就是name
    var title=req.body.title;
    var des=req.body.description;
    var content=req.body.content;

    pool.getConnection(function(err,conn){
        conn.query("update contents set tid=?,title=?,description=?,content=? where cid=?",
            [tid,title,des,content,cid],function(err,result){
            conn.release();
            if(err){
                console.log(err);
            }                                       //./上一级，会回到首页
            res.send("<script>alert('修改成功');location.href='./'</script>");
        });
    })
});

router.get("/content/add",function(req,res){
    pool.getConnection(function(err,conn){
       conn.query("select * from type order by tid",function(err,result){
           res.render("admin/content_add",{
               userInfo:req.session.userInfo,
               types:result
           });
       }) ;
    });
});

//修改
router.post("/content/add",function(req,res){
    //剩下的数据，都是通过form表单提交的，所以用body
    var tid=Number(req.body.category);      //form表单提交，键就是name
    var title=req.body.title;
    var des=req.body.description;
    var content=req.body.content;
    var date=new Date();
    var addTime=date.getFullYear() + "," +(date.getMonth()+1) +"," + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
    pool.getConnection(function(err,conn){
        conn.query("insert into contents values(0,?,?,?,?,?,?,0,0)",
            [tid,req.session.userInfo.uid,title,addTime,des,content],function(err,result){
                conn.release();
                if(err){
                    console.log(err);
                }                                       //./上一级，会回到首页
                res.send("<script>alert('添加成功');location.href='./'</script>");
            });
    })
});



//第三步,将这个支线模块，加载到主模块里面去
module.exports=router;