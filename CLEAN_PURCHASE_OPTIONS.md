# 🎨 Opções Clean para Botão de Compra

## ✅ **Opção Atual (Implementada)**
```jsx
<button className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 underline underline-offset-2 hover:no-underline">
  Não tem código? Compre seu acesso aqui
</button>
```

## 🎯 **Outras Opções Clean**

### **Opção 1: Texto Simples**
```jsx
<div className="text-center text-xs text-muted-foreground">
  <span>Sem código? </span>
  <button onClick={handlePurchaseClick} className="text-primary hover:underline">
    Compre aqui
  </button>
</div>
```

### **Opção 2: Badge Sutil**
```jsx
<div className="flex justify-center">
  <button 
    onClick={handlePurchaseClick}
    className="text-xs bg-muted/50 hover:bg-muted px-3 py-1 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
  >
    💎 Comprar Acesso
  </button>
</div>
```

### **Opção 3: Linha Divisória com Texto**
```jsx
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-border/30" />
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-card px-2 text-muted-foreground">
      <button onClick={handlePurchaseClick} className="text-primary hover:underline">
        Comprar acesso
      </button>
    </span>
  </div>
</div>
```

### **Opção 4: Ícone Mínimo**
```jsx
<div className="text-center">
  <button 
    onClick={handlePurchaseClick}
    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
  >
    <span>🔓</span>
    <span>Obter acesso</span>
  </button>
</div>
```

### **Opção 5: Dots/Elipsis**
```jsx
<div className="text-center">
  <button 
    onClick={handlePurchaseClick}
    className="text-xs text-muted-foreground hover:text-primary transition-colors"
  >
    ••• Comprar acesso •••
  </button>
</div>
```

## 🏆 **Recomendação**

Para um design **ultra clean**, sugiro a **Opção 1** ou manter a atual. São as mais discretas e elegantes.

Qual opção você prefere? Posso implementar qualquer uma delas!
