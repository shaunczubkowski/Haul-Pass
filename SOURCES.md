# FillRight Data Sources

This file documents the primary sources used for all truck specification data in
`src/data/trucks.ts` (tank capacities, MPG estimates, fuel types). FillRight is a
money-decision tool — these figures directly affect the fuel calculation, so they
must be auditable.

All figures are estimates for **empty trucks under ideal conditions**. Loaded MPG
will be lower. Specs vary by make, model, year, and location.

---

## U-Haul

All U-Haul trucks use **regular unleaded gasoline**.

| Truck | Tank (gal) | MPG est. | Source |
|---|---|---|---|
| 8 ft Pickup | 34 | 19 | [uhaul.com/Truck-Rentals/Pickup-Truck](https://www.uhaul.com/Truck-Rentals/Pickup-Truck/) |
| Cargo Van | 26 | 18 | [uhaul.com/Truck-Rentals/Cargo-Van](https://www.uhaul.com/Truck-Rentals/Cargo-Van-Truck/) |
| 10 ft | 31 | 12 | [uhaul.com/Truck-Rentals/10ft-Moving-Truck](https://www.uhaul.com/Truck-Rentals/10ft-Moving-Truck/) |
| 15 ft | 40 | 10 | [uhaul.com/Truck-Rentals/15ft-Moving-Truck](https://www.uhaul.com/Truck-Rentals/15ft-Moving-Truck/) |
| 17 ft | 40 | 10 | [uhaul.com/Truck-Rentals/17ft-Moving-Truck](https://www.uhaul.com/Truck-Rentals/17ft-Moving-Truck/) |
| 20 ft | 40 | 10 | [uhaul.com/Truck-Rentals/20ft-Moving-Truck](https://www.uhaul.com/Truck-Rentals/20ft-Moving-Truck/) |
| 24 ft | 60 | 7 | [uhaul.com/Truck-Rentals/24ft-Moving-Truck](https://www.uhaul.com/Truck-Rentals/24ft-Moving-Truck/) |
| 26 ft | 60 | 7 | [uhaul.com/Truck-Rentals/26ft-Moving-Truck](https://www.uhaul.com/Truck-Rentals/26ft-Moving-Truck/) |

MPG figures cross-referenced with:
- [U-Pack: U-Haul gas mileage guide](https://www.upack.com/articles/what-is-the-gas-mileage-of-a-u-haul-rental-truck) (retrieved 2026-03-10)
- [HireAHelper: Rental truck MPG guide](https://blog.hireahelper.com/how-to-save-money-on-your-rental-trucks-gas/) (retrieved 2026-03-10)

---

## Penske

Penske consumer moving trucks (12 ft, 16 ft) use **regular gasoline**. The 22 ft and
26 ft trucks are available in **diesel**.

| Truck | Tank (gal) | MPG est. | Fuel | Source |
|---|---|---|---|---|
| 12 ft | 26 | 12 | **regular** | [pensketruckrental.com/trucks-and-vans/12-foot-truck](https://www.pensketruckrental.com/trucks-and-vans/12-foot-truck/) |
| 16 ft | 33 | 10 | **regular** | [pensketruckrental.com/…/16-foot-box-truck](https://www.pensketruckrental.com/commercial-truck-rental/commercial-trucks/light-duty-trucks/16-foot-box-truck/) |
| 22 ft | **70** | 8 | diesel | [pensketruckrental.com/…/22-foot-truck](https://www.pensketruckrental.com/trucks-and-vans/22-foot-truck/) |
| 26 ft | **70** | 7 | diesel | [pensketruckrental.com/…/22-26-foot-box-truck](https://www.pensketruckrental.com/commercial-truck-rental/commercial-trucks/medium-duty-trucks/22-26-foot-box-truck/) |

_22 ft and 26 ft tank updated from 50 → 70 gal on 2026-03-15. Penske lists both trucks on the same 22–26 ft spec page with a 70-gallon diesel tank. Closes issues #63 and #50._

---

## Budget

All Budget trucks use **regular unleaded gasoline**.

| Truck | Tank (gal) | MPG est. | Source |
|---|---|---|---|
| 10 ft | 31 | 12 | [budgettruck.com/…/truckdetails12foot](https://www.budgettruck.com/moving-trucks-accessories/truckdetails12foot) |
| 16 ft | 40 | 10 | [budgettruck.com/…/truckdetails16foot](https://www.budgettruck.com/moving-trucks-accessories/truckdetails16foot) |
| 24 ft | 60 | 7 | [budgettruck.com (size guide)](https://www.budgettruck.com/faq/q/sizes) |
| 26 ft | 60 | 7 | [budgettruck.com/…/truckdetails26foot](https://www.budgettruck.com/moving-trucks-accessories/truckdetails26foot) |

> **Note:** Budget does not publish exact tank capacities on all truck detail pages.
> Tank sizes for the 24 ft and 26 ft remain derived from community comparisons with
> equivalent U-Haul sizes and the [HireAHelper rental truck guide](https://blog.hireahelper.com/how-to-save-money-on-your-rental-trucks-gas/)
> (retrieved 2026-03-10). One third-party source (miramarspeedcircuit.com) suggests
> the Budget 26 ft tank may be **50 gal** rather than 60 gal. Official Budget spec
> pages don't publish this figure directly. Keeping 60 gal until a primary source
> confirms otherwise. See issue #64.

---

## Enterprise

All Enterprise consumer moving trucks use **regular unleaded gasoline**.

| Truck | Tank (gal) | MPG est. | Source |
|---|---|---|---|
| 10 ft | 31 | 12 | [enterprisetrucks.com (vehicle comparison)](https://www.enterprisetrucks.com/truckrental/en_US/vehicles/commercial-truck-comparison-guide.html) |
| 16 ft | 40 | 10 | [enterprisetrucks.com (vehicle comparison)](https://www.enterprisetrucks.com/truckrental/en_US/vehicles/commercial-truck-comparison-guide.html) |
| 24 ft | 60 | 7 | [enterprisetrucks.com/…/24--straight-personal](https://www.enterprisetrucks.com/truckrental/en_US/vehicles/straight-trucks/24--straight-personal.html) |

The 24 ft replaces an earlier `enterprise-26ft` entry that could not be confirmed as
a standard consumer SKU — see [#42](https://github.com/shaunczubkowski/Haul-Pass/issues/42).
Enterprise does offer a 26 ft for **commercial** use
([enterprisetrucks.com/…/26--straight-business](https://www.enterprisetrucks.com/truckrental/en_US/vehicles/straight-trucks/26--straight-business.html)),
but this is not in the standard consumer lineup at all locations.

MPG and tank estimates for 10 ft and 16 ft are derived from industry averages for
comparable truck classes, as Enterprise does not publish per-truck fuel specs. Source:
[HireAHelper rental truck guide](https://blog.hireahelper.com/how-to-save-money-on-your-rental-trucks-gas/)
(retrieved 2026-03-10).

---

## General MPG reference

For cross-company MPG comparisons and methodology:

- [U-Pack rental truck MPG guide](https://www.upack.com/articles/what-is-the-gas-mileage-of-a-u-haul-rental-truck) (retrieved 2026-03-10)
- [U-Pack Budget truck gas mileage guide](https://www.upack.com/articles/budget-truck-rental-gas-mileage) (retrieved 2026-03-10)
- [HireAHelper: Rental truck MPG, fuel type, and policies](https://blog.hireahelper.com/how-to-save-money-on-your-rental-trucks-gas/) (retrieved 2026-03-10)
- [miramarspeedcircuit.com: U-Haul gas mileage](https://www.miramarspeedcircuit.com/u-haul-gas-mileage/) (retrieved 2026-03-10)
