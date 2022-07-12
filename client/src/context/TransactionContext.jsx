import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const initialState = "";

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();

  const transactionContract = new ethers.Contract(contractAddress, contractABI, signer)

  return transactionContract;
}

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState(initialState);
  const [formData, setFormData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
  const [transactions, setTransactions] = useState([]);

  const resetForm = () => {
    setFormData({ addressTo: "", amount: "", keyword: "", message: "" });
  }

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask and do appropiate setup!!")

      const accounts = await ethereum.request({ method: 'eth_accounts' })
      if (accounts.length) {
        setConnectedAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No account found")
      }
    } catch (error) {
      throw new Error("No etherum  object.")
    }
  }

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setConnectedAccount(accounts[0])
    } catch (error) {
      throw new Error("No ethereum object.")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    })
  }

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: connectedAccount,
          to: addressTo,
          gas: '0x5208', // 2100 GWEI
          value: parsedAmount._hex,
        }]
      })

      const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword)

      setIsLoading(true);
      console.log('Loading---------', transactionHash.hash)
      await transactionHash.wait();
      setIsLoading(false);

      console.log('Success---------', transactionHash.hash)

      const transactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionCount.toNumber())
      resetForm();
    } catch (error) {
      console.log(error?.message, '--------------error')
      throw new Error("No ethereum object")
    }
  }

  const checkIfTransactionExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();
      localStorage.setItem("transactionCount", transactionCount)
    } catch (error) {
      throw new Error("No Ethereum Object.")
    }
  }

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const transactionContract = getEthereumContract();

      const availableTransactions = await transactionContract.getAllTransactions();

      const newAvlTransaction = availableTransactions.map((ts) => {
        return {
          addressTo: ts.from,
          addressFrom: ts.sender,
          timestamp: new Date(ts.timestamp.toNumber() * 1000).toLocaleString(),
          message: ts.message,
          keyword: ts.keyword,
          amount: parseInt(ts.amount._hex) / (10 ** 18)
        }
      })

      setTransactions(newAvlTransaction);

    } catch (error) {
      throw new Error("Something went wrong while fetching transaction")
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionExist();
  }, [])

  return (
    <TransactionContext.Provider value={{ connectWallet, connectedAccount, formData, transactions, sendTransaction, handleChange, isLoading }}>
      {children}
    </TransactionContext.Provider>
  )
}