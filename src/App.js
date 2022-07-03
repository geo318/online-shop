import React from 'react';
import './css/App.css';
import Header from './components/header';
import Category from './components/categories';
import Cart from './components/cart';
import Product from './components/product';
import Error from './components/page-components/error';
import fetchQuery from './querries/fetchQuery';
import { ProductsPriceQuery } from './querries/querries';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      category : 'all',
      activeCurrency : 'USD',
      newContent: 'old',
      cart: [], // contains product id and number
      cartItemNum: 0,
      cartItemParams: [],
      prices: [], // cart helper array holding product id and price
      sumTotal : 0,
      productID : null, // passing product page to fetch product
      symbol: '$', // displays an active currency symbol on navbar
    }
    this.symbolHandle = this.symbolHandle.bind(this);
    this.setItemParameters = this.setItemParameters.bind(this);
  }

  componentDidMount() {
    this.sumCartItems(this.state.cart);
    this.calculateSum();
    
    // using local storage to prevent data loss if page refreashed
    let localState = JSON.parse(localStorage.getItem('app-state'));
    if(localState) this.setState(localState);
  }

  componentDidUpdate(prevProps, prevState) {
    localStorage.setItem('app-state', JSON.stringify(this.state));

    if(prevState.activeCurrency !== this.state.activeCurrency) {
      let array = [];
      this.state.cart.forEach((e)=> 
        array.push(fetchQuery(ProductsPriceQuery, {product : e.id}))
      );
      /* 
        to prevent data loss upon fetching a querry, 
        data is stored in a helper array until the fetching process is complete
      */
      Promise.all(array).then(data => {
        this.setState({prices:[]});
        let priceArr = [];
        data.forEach((el)=> {
          let e = el.data.product;
          priceArr.push({id : e.id, price: e['prices'][this.switchCurrency(this.state.activeCurrency)]['amount']});
        })
        this.setState({prices : priceArr});
        this.calculateSum();
      })
    }
  }

  // setting state for cart product attribiutes

  setItemParameters(id, name, param) {
    let array = this.state.cartItemParams;
    let indx = array.findIndex((e) => id === e['id']);
    if(indx < 0) {
      return this.setState(
        { cartItemParams : [...array, {id: id, attr : [ {name : name, param : param} ]}] }
      );
    } 
    
    let attrArr = array[indx]['attr'];
    let attrIndx = array[indx]['attr'].findIndex((e) => name === e['name']);

    if(attrIndx < 0) {
      return this.setState(
        {cartItemParams : [
          ...array.slice(0,indx), {id: id, attr : [ 
            ...attrArr,{name : name, param : param},...array.slice(indx + 1) 
          ]}
        ]}
      );
    }

    return this.setState({ 
      cartItemParams : [
        ...array.slice(0,indx), {id: id, attr : [
          ...attrArr.slice(0,attrIndx), {name : name, param : param},...attrArr.slice(attrIndx + 1) 
        ]},
        ...array.slice(indx + 1)
      ]}
    );
  }

  // sumps up current prices for all items in the cart
  calculateSum = () => {
    let sum = this.state.prices.reduce((total,current,i) => total += current.price * this.state.cart[i]['num'], 0);
    return sum
  }

  symbolHandle(val) {
    this.setState({symbol : val});
  }

  itemPrice = (id, amount) => {
    let pricesArray = this.state.prices;
    if(pricesArray.every(e => id !== e.id)) {
      this.setState({ prices: [...pricesArray, {id: id, price : amount}] });
      return
    }
    if(pricesArray.some(e => id === e.id && e.price === amount)) return

      let indx = pricesArray.findIndex((e) => id === e['id']);
      this.setState({ prices: [...pricesArray.slice(0, indx), {id: id, price : amount}, ...pricesArray.slice(indx + 1)] });
  }

  // sums up total number of items in the cart

  sumCartItems = (arr) => { 
    let num = arr.reduce(
      (total, curr) => { 
        total += curr['num'] 
        return total
      }, 0);
    this.setState( { cartItemNum : num } );
  }

  // increasing product number
  adjustCartItemNumber = (productId, operation)=> {
    let cartArray = this.state.cart;
    let indx = cartArray.findIndex((e) => productId === e['id']);
    let productNum = cartArray[indx]['num'] + operation;

    if(productNum === 0) {
      this.setState({ cartItemNum : this.state.cartItemNum + operation });
      this.setState({ cart: [...cartArray.slice(0, indx),...cartArray.slice(indx + 1) ] });
      this.setState({ prices: [...this.state.prices.slice(0, indx),...this.state.prices.slice(indx + 1)] });
      return
    }
    this.setState({ cart: [...cartArray.slice(0, indx),{id : productId, num : productNum},...cartArray.slice(indx + 1) ] });
    this.setState({ cartItemNum : this.state.cartItemNum + operation });
  }

  addToCart = productId => {
    let cartArray = this.state.cart;
    if(this.state.cart.some((e) => productId === e['id'])) {
      this.adjustCartItemNumber(productId, +1);
      return
    }
    
    this.setState({ cart: [{id : productId, num : 1}, ...cartArray] });
    this.setState({ cartItemNum : this.state.cartItemNum + 1 });
  }

  categoryFilter = setCategory => {
    this.setState({ category : setCategory });
  }

  currencyFilter = setCurrency => {
    this.setState({ activeCurrency : setCurrency });
  }

  detectNewContent = (className) => {
    this.setState({ newContent: className });
  }

  switchCurrency(cur) {
    switch(cur) {
      case "GBP": 
        return '1'
      case "AUD": 
        return '2'
      case "JPY": 
        return '3'
      case "RUB": 
        return '4'
      default:
        return '0'
    }
  }

  setProductId = (id) => {
    this.setState({productID : id})
  }

  render() {
    return (
      <>
        <Router>
        <Header appProps = {this} symbol = {this.state.symbol} activeCategory = {this.state.category}/>      
          <div className='main'>
            <div className='wrapper'>
              <Routes>
                <Route path="/" element={<Category category = {this.state.category} appProps = {this}/>}/>
                <Route path="/cart" element={<Cart appProps = {this}/>} />
                <Route path="/products/:productId" element={<Product appProps = {this}/>}/>
                <Route path="/*" element={<Error/>} />
              </Routes>
            </div>
          </div>
        </Router>
      </>
    );
  }
}

export default App;