import React from 'react';
import './css/App.css';
import Header from './Components/header';
import Category from './Components/Categories';
import Cart from './Components/cart';
import Product from './Components/product';
import Error from './Components/page-components/error';
import Front from './Components/page-components/front';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      category : '',
      activeCurrency : 'USD',
      newContent: 'old',
      cart: [], // contains product id and number
      cartItemNum: 0,
      sumTotal : 0,
      attributesPassed: [],
      cartItemIndex: "",
      productID : null, // passing product page to fetch product
      symbol: '$', // displays an active currency symbol on navbar
      linkedFromCart : false,
      history: [],
      renderCart: false
    }
    this.symbolHandle = this.symbolHandle.bind(this);
    this.linkedFromCart = this.linkedFromCart.bind(this);
    this.setHistory = this.setHistory.bind(this);
  }

  componentDidMount() {
    this.setHistory('/')
    this.calculateSum();
    // using local storage to prevent data loss if page refreshed
    let localState = JSON.parse(localStorage.getItem('app-state'));
    if(localState) this.setState(localState);
  }

  componentDidUpdate(prevProps, prevState) {
    localStorage.setItem('app-state', JSON.stringify(this.state));
    if(prevState.activeCurrency !== this.state.activeCurrency) {
      this.calculateSum();
    }
  }

  // sumps up current prices for all items in the cart
  calculateSum = () => {
    let priceArray = []
    this.state.cart.forEach(e => priceArray.push({price: e.price[this.switchCurrency(this.state.activeCurrency)]['amount'], num: e.num  }))
    return priceArray.reduce((total,current,i) => 
      total += current.price * current.num, 0
    );
  }

  symbolHandle(val) {
    this.setState({symbol : val});
  }

  addToCart = params => {
    const {id, price, attrArray, index, attrIndex, value, increment, decrement, changeParam} = params;

    let operation = decrement ? -1 : 1;

    let cartArray = this.state.cart;
    let indx = cartArray.findIndex((e) => id === e.id);
    !changeParam && this.setState({cartItemNum: this.state.cartItemNum + operation});

    if(indx < 0) {
      this.setState({ cart : [{ id: id, price: price, num: operation, attr : attrArray },...cartArray] })
      return
    }
    
    if(increment || decrement) {
      let cartItemCopy = cartArray[index]
      cartItemCopy.num += operation;

      if(cartItemCopy.num === 0) {
        this.setState({ cart : [...cartArray.slice(0, index),...cartArray.slice(index + 1)] })
        this.setState({ renderCart : !this.state.renderCart })
        return
      }
      this.setState({ cart : [...cartArray.slice(0, index), cartItemCopy,...cartArray.slice(index + 1)] })
      return
    }

    if(changeParam) {
      let cartItemCopy = cartArray[index]
      cartItemCopy.attr[attrIndex].param = value
      this.setState({ cart : [...cartArray.slice(0, index), cartItemCopy,...cartArray.slice(index + 1)] })
      return
    }

    if(cartArray.filter(e => e.id === id ).some(el => el.attr.every((attr,i) => attr.param === attrArray[i].param))) {
      let itemIndex = cartArray.findIndex(e => e.id === id && e.attr.every((el, i) => el.name === attrArray[i].name && el.param === attrArray[i].param))
      let cartItemCopy = cartArray[itemIndex];
      cartItemCopy.num += operation;
      this.setState({ cart : [cartItemCopy,...cartArray.slice(0, itemIndex),...cartArray.slice(itemIndex + 1)] })
      return
    }

    this.setState({ cart : [{ id: id, price: price, num: 1, attr : attrArray }, ...cartArray] })
    return
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

  setCartProps(cartArray, i, id) {
    if(cartArray.length === 0) return this.setState({ attributesPassed : [] })
    this.setState({ attributesPassed : {id: id, attr: cartArray[i]['attr']} })
  }

  setIndex(i) {
    this.setState({cartItemIndex : i})
  }

  linkedFromCart(bool) {
    this.setState({ linkedFromCart : bool })
  }

  setHistory(page) {
    this.setState({ history : [...this.state.history, page] })
    return
  }

  render() {
    return (
      <>
        <Router>
        <Header appProps = {this} symbol = {this.state.symbol} activeCategory = {this.state.category}/>      
          <div className='main'>
            <div className='wrapper'>
              <Routes>                
                <Route exact path="/" element={<Front reset = {()=> this.setState({category: ''})} history = {this.state.history} />}/>
                <Route exact path="/categories/:category" element={<Category category = {this.state.category} appProps = {this}/>}/>
                <Route exact path="/cart" element={<Cart num = {this.state.cartItemNum} render = {this.state.renderCart} appProps = {this} />} />
                <Route path="/products/:productId" element={<Product history = {this.state.history} linkedFromCart = {this.state.linkedFromCart} cartItemIndex = {this.state.cartItemIndex} attributesPassed = {this.state.attributesPassed} appProps = {this} id = {this.state.productID}/>}/>
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