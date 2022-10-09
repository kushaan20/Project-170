var uidNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function() {

    if (tableNumber === null) {
      this.askUidNumber();
    }

    var toys = await this.getToys();

    this.el.addEventListener("markerFound", () => {
      var markerId = this.el.id;
      this.handleMarkerFound(toys, markerId);
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askUidNumber: function() {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title:"Welcome!",
      icon:iconUrl,
      content:{
        element:"input",
        attributes:{
          placeholder:"Enter Your UID Number",
          type:"number",
          min:"1",
        }
      },
      closeOnClickOutside:false
    }).then(val=>{
      uidNumber=val
    })
  },

  handleMarkerFound: function(toys, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is out of stock today!",
        timer: 2500,
        buttons: false
      });
    } else {
       // Changing Model scale to initial scale
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      //Update UI content VISIBILITY of AR scene(MODEL , INGREDIENTS & PRICE)
      model.setAttribute("visible",true)

      var mainPlane = document.querySelector(`#main-plane-${toy.id}`)
      mainPlane.setAttribute("visible",true)

      var pricePlane = document.querySelector(`#price-plane-${toy.id}`)
      pricePlane.setAttribute("visible",true)
      
      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");

      // Handling Click Events
      ratingButton.addEventListener("click", function() {
        swal({
          icon: "warning",
          title: "Total orders",
          text: "Work In Progress"
        });
      });

      orderButtton.addEventListener("click", () => {
      this.handleOrder()

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order!",
          text: "Your order will be delivered!",
          timer: 2000,
          buttons: false
        });

        orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );
      });
    }
  },
  handleOrder: function(uid, toy) {
    firebase.firestore()
    .collection("users")
    .doc(uid)
    .get()
    .then(snap=> {
      var details = doc.data()
      if(details["current_orders"][toy.id]){
        details["current_orders"][toy.id]["quantity"]+=1
        details["current_orders"][toy.id]["subTotal"] = details["current_orders"][toy.id]["quantity"]*toy.price
      }else{
        details["current_orders"][toy.id]={
          item:toy.toy_name,
          price:toy.price,
          quantity:1,
          subTotal:toy.price
        }
      }
      details.total_bill+=toy.price
      firebase.firestore().collection("users").doc(doc.id).update(details)
    })
  },

  getToys: async function() {
    return await firebase
      .firestore()
      .collection("users")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },

  getOrderSummary: async function (tNumber) {
    return await firebase
      .firestore()
      .collection("tables")
      .doc(tNumber)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummary: async function () {

    //Getting Table Number
    var tNumber;
    tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;

    //Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(tNumber);

    //Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Get the table element
    var tableBodyTag = document.getElementById("bill-table-body");

    //Removing old tr(table row) data
    tableBodyTag.innerHTML = "";

    //Get the current_orders key 
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Create table row
      var tr = document.createElement("tr");

      //Create table cells/columns for ITEM NAME, PRICE, QUANTITY & TOTAL PRICE
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Add HTML content 
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Append cells to the row
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Append row to the table
      tableBodyTag.appendChild(tr);
    });

  var totalTr = document.createElement("tr")
  var td1 = document.createElement("td")
  td1.setAttribute("class","no-line")  
  var td2 = document.createElement("td")
  td2.setAttribute("class","no-line")  
  var td3 = document.createElement("td")
  td3.setAttribute("class","no-line text-center")  
  var strong1 = document.createElement("strong")
  strong1.innerHTML = "Total"
  td3.appendChild(strong1)
  var td4 = document.createElement("td")
  td4.setAttribute("class","no-line text-center")
  td4.innerHTML = "$"+orderSummary.total_bill

  totalTr.appendChild(td1)
  totalTr.appendChild(td2)
  totalTr.appendChild(td3)
  totalTr.appendChild(td4)
  tableBodyTag.appendChild(totalTr)
  
  },
  handlePayment: function () {
    document.getElementById("modal-div").style.display = "flex";
    var tNumber;
        tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
    firebase.firestore().collection("tables").doc(tNumber).update({
      total_bill : 0,
      current_orders : {}
    }).then(() => {
      swal({
        title: "Payment Completed!",
        icon: "success",
        text: "Thank you for dining with us!",
        closeOnClickOutside: true,
      })
    })
  },

  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});