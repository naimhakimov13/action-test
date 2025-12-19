"use client";

import { useState } from "react";

interface Order {
  id: number;
  customer: string;
  address: string;
  bottles: number;
  status: "pending" | "in-transit" | "delivered";
  time: string;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      customer: "Иван Петров",
      address: "ул. Ленина, д. 45, кв. 12",
      bottles: 3,
      status: "pending",
      time: "10:30",
    },
    {
      id: 2,
      customer: "Мария Сидорова",
      address: "пр. Мира, д. 78, кв. 5",
      bottles: 2,
      status: "in-transit",
      time: "11:00",
    },
    {
      id: 3,
      customer: "Алексей Новиков",
      address: "ул. Пушкина, д. 23, кв. 8",
      bottles: 5,
      status: "delivered",
      time: "09:15",
    },
    {
      id: 4,
      customer: "Ольга Морозова",
      address: "бул. Победы, д. 12, кв. 34",
      bottles: 1,
      status: "pending",
      time: "12:00",
    },
  ]);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inTransit: orders.filter((o) => o.status === "in-transit").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const updateStatus = (id: number, newStatus: Order["status"]) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "in-transit":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Ожидает / Pending";
      case "in-transit":
        return "В пути / In Transit";
      case "delivered":
        return "Доставлено / Delivered";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">💧</div>
              <div>
                <h1 className="text-2xl font-bold text-cyan-600">Aqua Delivery</h1>
                <p className="text-sm text-gray-500">Панель управления / Dashboard</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Сегодня: {new Date().toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Всего / Total</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Ожидают / Pending</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">В пути / In Transit</p>
                <p className="text-3xl font-bold text-gray-800">{stats.inTransit}</p>
              </div>
              <div className="text-4xl">🚚</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Доставлено / Delivered</p>
                <p className="text-3xl font-bold text-gray-800">{stats.delivered}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500">
            <h2 className="text-xl font-bold text-white">
              Заказы / Orders
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент / Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Адрес / Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Бутылки / Bottles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время / Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус / Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия / Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center">
                        💧 {order.bottles}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(order.id, e.target.value as Order["status"])
                        }
                        className="block w-full px-3 py-1 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        <option value="pending">Ожидает / Pending</option>
                        <option value="in-transit">В пути / In Transit</option>
                        <option value="delivered">Доставлено / Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
