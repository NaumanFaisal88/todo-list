const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { render } = require("ejs");
const _ = require("lodash");

const app = express();
const PORT = process.env.PORT || 3000


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://Nauman:Nauman88@cluster1.jfub2wg.mongodb.net/todolistDB", { useNewUrlParser: true });
const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome"
});
const item2 = new Item({
    name: "Hit the + button to add to your list"
});
const item3 = new Item({
    name: "Click on the ▢ checkboxes to delete"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);


async function saveItems() {
    try {
        await Item.insertMany(defaultItems);
        console.log("Successfully added our default items to database");
    }
    catch (err) {
        console.log(err);
    }
}

app.get("/", async function (req, res) {

    try {
        const foundItems = await Item.find({});
        if (foundItems.length === 0) {
            saveItems();
            res.redirect("/");
        }
        else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Error occurred while retrieving items");

    }

});
app.get("/:customListName", async function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    try {
        const foundList = await List.findOne({ name: customListName });
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.error(err);
    }
});


app.post("/", function (req, res) {
    const itemName = req.body.nextItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save()
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(function (foundList) {
                foundList.items.push(item);
                return foundList.save();
            })
            .then(function () {
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});

app.post("/delete", async function (req, res) {
    const checkedItemsId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        async function removeItems() {
            try {
                await Item.findByIdAndRemove({ _id: checkedItemsId });
                console.log("Successfully removed checked item from database");
            } catch (err) {
                console.log(err);
            }
        }
        await removeItems();
        res.redirect("/");
    } else {
        try {
            const foundList = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemsId } } },
                { new: true }
            );
            res.redirect("/" + listName);
        } catch (err) {
            console.log(err);
        }
    }

});



app.listen(PORT, function () {
    console.log("Server connected");
});

