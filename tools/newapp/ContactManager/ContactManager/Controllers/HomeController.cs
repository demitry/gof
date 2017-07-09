using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ContactManagerApp.Core;


namespace ContactManagerApp.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            ViewBag.Title = AppSettings.Title;
          
            using (AppDbContext db = new AppDbContext())
            {
                var query = from c in db.Contacts
                            orderby c.Id ascending
                            select c;
                List<Contact> model = query.ToList();
                return View(model);
            }
        }


        public IActionResult AddContact()
        {
            ViewBag.Title = AppSettings.Title;
            return View();
        }

        [HttpPost]
        public IActionResult AddContact(Contact obj)
        {
            ViewBag.Title = AppSettings.Title;
            if (ModelState.IsValid)
            {
                using (AppDbContext db = new AppDbContext())
                {
                    db.Contacts.Add(obj);
                    db.SaveChanges();
                    ViewBag.Message = "Contact added successfully!";
                }
            }
            return View(obj);
        }

        public IActionResult DeleteContact(int id)
        {
            using (AppDbContext db = new AppDbContext())
            {
                var contact = (from c in db.Contacts
                                where c.Id == id
                                select c).SingleOrDefault();
                db.Contacts.Remove(contact);
                db.SaveChanges();
                return RedirectToAction("Index");
            }
        }

    }
}
