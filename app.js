//jshint esversion:6

const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv")

const app = express();

app.set('view engine', 'ejs');
dotenv.config();

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect(process.env.CONNECTION_STRING,{useNewUrlParser : true, useUnifiedTopology : true, useFindAndModify: false});

const itemSchema = {
  name : String
};
const Item = mongoose.model("Item",itemSchema);

Item.remove({});
const item1 = new Item({
  name : "Welcome to ToDoList app"
});
const item2 = new Item({
  name : "Press + button to add new item"
});
const item3 = new Item({
  name : "Tick checkbox to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name : String,
  items : [itemSchema]
}
const List = mongoose.model("List",listSchema);

const day = date.getDate();
app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){
      if(foundItems.length == 0){
        Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          }else {
            console.log("Successfully inserted default items.");
            res.redirect("/");
          }
        });
      }else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
  })

});

app.get("/:userInput",function(req,res){
  const userListName = _.capitalize(req.params.userInput);
  List.findOne({name : userListName},function(err,foundItem){
    if(!err){
      if(!foundItem){
        const newList = new List({
          name : userListName,
          items : defaultItems
        })
        newList.save(function(){
          res.redirect("/" + userListName);
        });
      }else {
        res.render("list",{listTitle : foundItem.name, newListItems : foundItem.items})
      }
    }
  })
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({
    name : itemName
  });

  if(listTitle == day){
    item.save();
    res.redirect("/");
  }else {
    List.findOne({name : listTitle},function(err,foundItem){
      foundItem.items.push(item);
      foundItem.save();
      res.redirect("/" + listTitle);
    })
  }

});

app.post("/delete",function(req,res){
  const checkedId = req.body.checkbox;
  const listTitle = req.body.listTitle;

  if(listTitle == day ){
    Item.findByIdAndRemove(checkedId,function(err){
      if(err){
        console.log(err);
      }else {
        console.log("Successfully deleted the item.");
        res.redirect("/");
      }
    })
  }else {
    List.findOneAndUpdate({name : listTitle},{$pull : {items : {_id : checkedId}}},function(err,foundList){
      if(!err){
        res.redirect("/" + listTitle);
      }
    })
  }
})

app.listen(process.env.PORT, function() {
  console.log("Server started on port 3000");
});
