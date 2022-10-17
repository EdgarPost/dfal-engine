---
type: Conversation
met: false
aboutBookStore: false
aboutRimos: false
---

# Conversation with someone

- [[LuPaul|Rabbit]]: Welcome to Book-a-Like, the best bookstore in all of the Senktim. 

## Who are you?

```condition
met = false
```

- [[LuPaul|Rabbit]]: My name is LuPaul. How can I help you?

```set-state
met = true
```

## Where am I?
```condition
met = true
aboutBookStore = false
```

- [[LuPaul|Rabbit]]: Well, the Book-a-Like, best bookstore in all of the Senktim. Though I feel like I already mentioned that.
- [[LuPaul|Rabbit]]: This bookstore is an absolute goldmine, if you're into reading that is. You can browse through our enormeous catalog, but if you are looking for a specific book or a topic, I suggest you talk to Rimos. You can probably find him hidden behind one of the bookshelves. 

```set-state
aboutBookStore = true
aboutRimos = true
```

## Actually, I was wondering where I am in a broader sense. I'm not from around here, you see. Is there a village nearby, maybe?
```condition
aboutBookStore = true
```

- [[LuPaul|Rabbit]]: Ah, a fellow traveler. So great to meet one after so long. You see, I didn't grow up here either. I just stumbled upon this place and just never left. 
- [[LuPaul|Rabbit]]: But enough about me. If you're looking for a village, the biggest one is just up ahead. It's the capital, called Cinu. Most other villages are very small, just a couple of houses here and there. But if you want to know more about these lands, just go talk to Rimos.
- [[LuPaul|Rabbit]]: Rimos is a living glossary tome, so you can ask him anything and he will know the answer. Be careful though, taking to Rimos for too long will make your head spin. 

## Where can I find this Rimos again?
```condition
aboutRimos = true
```

- [[LuPaul|Rabbit]]: You can probably find him hidden behind one of the bookshelves. 