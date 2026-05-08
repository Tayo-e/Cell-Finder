import {
  collection, doc, getDocs, getDoc,
  setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const CELLS_COL = "cells";
const USERS_COL = "users";

// ── 49 Real Harvesters Cell Locations ────────────────────────
export const SEED_CELLS = [
  // Zone A — Yaba / Mainland North (Zonal Leader: Olalekan Alese)
  { id:"cell-001", name:"Light House", leader:"Ajoke Salami", phone:"08067514958", address:"2 Tote Kuti Street, off Isaac John, Fadeyi Bus Stop, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5317, lng:3.3691 },
  { id:"cell-002", name:"Lagos Homs", leader:"Temiloluwa Ajibade", phone:"09050475521", address:"Behind Total Filling Station, Oshodi Express, beside TGI, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5493, lng:3.3451 },
  { id:"cell-003", name:"Goshen", leader:"Emmanuel Harry", phone:"08066415242", address:"1b Edmund Crescent, Jibowu, Yaba, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5068, lng:3.3769 },
  { id:"cell-004", name:"Joyful People", leader:"Ajibola Ogunbiyi", phone:"08065561737", address:"17 Eleko Street, Onigbongbo, Maryland, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5582, lng:3.3563 },
  { id:"cell-005", name:"Everlasting Father", leader:"Bro Patrick", phone:"08034076607", address:"29 Awofeso Street off Shipeolu, Somolu, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5444, lng:3.3825 },
  { id:"cell-006", name:"Touchbearers", leader:"Dolapo Roluga", phone:"08121636613", address:"Yaba College of Technology, Yaba, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5133, lng:3.3713 },
  { id:"cell-007", name:"House Of Phoebe", leader:"Mrs Okeke", phone:"08034695867", address:"5a Ogunmola Alara Street off Nureni Yusuf Road, Alagbado, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.6167, lng:3.2397 },
  { id:"cell-008", name:"Rehoboth", leader:"Afolasade Okewale", phone:"08135530260", address:"26 Arolahan Street off Kayode Street, Onipanu, Lagos", zone:"Zone A", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5379, lng:3.3793 },
  // Zone B — Gbagada / Shomolu (Zonal Leader: Jummai Elgi)
  { id:"cell-009", name:"David Cell", leader:"Ann", phone:"08133421505", address:"20 Mutairu Street, Charley Boy Bus Stop, Gbagada, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5572, lng:3.3874 },
  { id:"cell-010", name:"The Lord's Hand", leader:"Ime", phone:"08060168266", address:"5 Ongunlesi Street off Bode Thomas Street, Onipanu, Ikorodu Road, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5379, lng:3.3793 },
  { id:"cell-011", name:"Jasmine Cell", leader:"Allen", phone:"09036603018", address:"4B Igbeyin Adun Street, off Charley Boy Bus Stop, Gbagada, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5572, lng:3.3874 },
  { id:"cell-012", name:"Millennium Estate Cell", leader:"David", phone:"08086200631", address:"21 Amoda Ali, Millennium Estate, Gbagada, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5572, lng:3.3874 },
  { id:"cell-013", name:"Sapphire Cell", leader:"Comfort", phone:"07032226841", address:"21 Akinsanya Street off Pedro, Palmgrove Bus Stop, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5548, lng:3.3731 },
  { id:"cell-014", name:"Hallelujah Cell", leader:"Juli", phone:"08071128734", address:"63 Apata Street, Shomolu, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5444, lng:3.3825 },
  { id:"cell-015", name:"Tahilla Cell", leader:"Jummai", phone:"08055341473", address:"20 Opanubi Street off Awofeso Street, Shomolu, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5444, lng:3.3825 },
  { id:"cell-016", name:"Heaven's Home", leader:"Jummai", phone:"08055341473", address:"11/17 Otunba Showbawale Estate, Gbagada, Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5572, lng:3.3874 },
  { id:"cell-017", name:"Tahila Cell", leader:"Victor", phone:"09019208941", address:"Ogundare Awise Street, Gbagada (around Soluyi), Lagos", zone:"Zone B", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5572, lng:3.3874 },
  // Zone C — Anthony Village / Maryland (Zonal Leader: Olubunmi Sobande)
  { id:"cell-018", name:"Glory Cell", leader:"Olufunke Adeniyi", phone:"07069442328", address:"14 Akerele Street, Onigbongbo, Maryland, Lagos", zone:"Zone C", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5582, lng:3.3563 },
  { id:"cell-019", name:"The Gratitude Cell", leader:"Esther Michael Osaade", phone:"07083932670", address:"16 Opeifa Crescent, Ajao Estate, Anthony Village, Lagos", zone:"Zone C", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5560, lng:3.3420 },
  { id:"cell-020", name:"Dominion Cell", leader:"Oluwakemi Olaoluwa", phone:"08145274312", address:"55 Adebayo Mokuolu Street, New Castle Road, Anthony Village, Lagos", zone:"Zone C", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5590, lng:3.3578 },
  { id:"cell-021", name:"Cornerstone Cell", leader:"Olubunmi Sobande", phone:"08027506687", address:"57 Adediran Ajao Crescent, Ajao Estate, Anthony Village, Lagos", zone:"Zone C", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5560, lng:3.3420 },
  { id:"cell-022", name:"Lighthouse Cell", leader:"Dipo Durojaiye", phone:"07088161687", address:"44 Ope-Ifa Crescent, Anthony Village, Lagos", zone:"Zone C", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5590, lng:3.3578 },
  // Zone D — Mende / Ikeja (Zonal Leader: Adenike Odesanya)
  { id:"cell-023", name:"Rooftop", leader:"Happiness", phone:"08152160435", address:"1 Akinwunmi Street, Mende, Lagos", zone:"Zone D", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5623, lng:3.3683 },
  { id:"cell-024", name:"Mende Villa Cell", leader:"Tobi", phone:"08063947910", address:"G2 Mende Villa 2, Walsall Condominium, Mende, Lagos", zone:"Zone D", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5623, lng:3.3683 },
  { id:"cell-025", name:"Karis Cell", leader:"Nike", phone:"09099156493", address:"19a Olori Adekemi Ajibola Street, Arowojobe Estate, Mende, Lagos", zone:"Zone D", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5623, lng:3.3683 },
  { id:"cell-026", name:"Azriel Cell", leader:"Mayowa", phone:"08050878465", address:"Ikeja Cantonment, Ikeja, Lagos", zone:"Zone D", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5950, lng:3.3500 },
  // Zone E — Oshodi / Mushin / Egbeda (Zonal Leader: Solomon Ilegogie)
  { id:"cell-027", name:"Oshodi Cell", leader:"Lekan Gafari", phone:"07033781592", address:"20 Oyegunwa Street, Oshodi, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5493, lng:3.3451 },
  { id:"cell-028", name:"Mafoluku Cell", leader:"Emmanuel Odeh", phone:"07037291510", address:"Omilade Street, Mafoluku, Oshodi, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5450, lng:3.3390 },
  { id:"cell-029", name:"Illupeju Cell", leader:"James Dipeolu", phone:"08183484929", address:"26 Kayode Arolawun Street, Onipanu, Ilupeju, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5532, lng:3.3563 },
  { id:"cell-030", name:"Jakande Cell", leader:"Naomi Ojeh", phone:"08091050111", address:"Block 67 Flat 1, Jakande Estate, Isolo, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4836, lng:3.2911 },
  { id:"cell-031", name:"Isolo Cell", leader:"Ngozi Anuruo", phone:"08037715303", address:"24 Akiti Avenue, Okota Road, Isolo, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4939, lng:3.3457 },
  { id:"cell-032", name:"Mushin Cell", leader:"Joseph", phone:"09051890332", address:"26 Awoniyi Street, off LUTH Gate, Mushin, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5309, lng:3.3551 },
  { id:"cell-033", name:"Egbeda Cell", leader:"Daniel Mbibi", phone:"07069117467", address:"Winners House, D Close, 111 Road, Gowon Estate, Egbeda, Lagos", zone:"Zone E", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5226, lng:3.3015 },
  // Surulere Zone
  { id:"cell-034", name:"City Of David", leader:"Daniel John", phone:"08179752108", address:"60 Shakki Crescent Street, Aguda, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4934, lng:3.3578 },
  { id:"cell-035", name:"City Of Light", leader:"Blessing", phone:"07039763928", address:"31 Oni Street off Randle Avenue, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4969, lng:3.3538 },
  { id:"cell-036", name:"Dominion Surulere", leader:"Amara Anioko", phone:"07033438548", address:"33 Adewuyi Street, off Ijesha Market, Ijesha, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5022, lng:3.3563 },
  { id:"cell-037", name:"Costain Cell", leader:"Abiodun Amure", phone:"07066673426", address:"58 Brickfield Apapa Road, Costain, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4522, lng:3.3732 },
  { id:"cell-038", name:"Akinkunmi Cell", leader:"Fisayo", phone:"07062998504", address:"Akinkunmi Street, Aguda, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4934, lng:3.3578 },
  { id:"cell-039", name:"Amazing Cell", leader:"Amure Olabisi", phone:"08165647903", address:"39 Lagos Street, by Freeman, Ebute Metta, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4807, lng:3.3766 },
  { id:"cell-040", name:"Pathfinders", leader:"Ayewosa", phone:"08165647903", address:"16 Somosu Street, Aguda, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4934, lng:3.3578 },
  { id:"cell-041", name:"Faith City", leader:"Precious", phone:"08165647903", address:"43 Efutide Street off Brown Road, Coker, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4900, lng:3.3500 },
  { id:"cell-042", name:"Zion Cell", leader:"Mrs Lanre", phone:"", address:"1 Ikenne Close, Kilo Bus Stop, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4939, lng:3.3538 },
  { id:"cell-043", name:"Rehoboth Surulere", leader:"Temitope", phone:"09063451833", address:"11 Agbonyin Avenue off Adelabu, Surulere, Lagos", zone:"Surulere Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.4969, lng:3.3538 },
  // Ketu Zone (Zonal Leader: Mrs Joy Suleman)
  { id:"cell-044", name:"Ketu Cell — Irawo", leader:"Mrs Joy Suleman", phone:"08169483643", address:"46 Thomas Laniyan Street, Irawo Bus Stop, Ikorodu Road, Lagos", zone:"Ketu Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5781, lng:3.3928 },
  { id:"cell-045", name:"Ketu Cell — Alapere", leader:"Mr Kennis Ugwuoga", phone:"08063964553", address:"19 Odumosu Street, Alapere-Ketu, Oriola Bus Stop, Lagos", zone:"Ketu Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5941, lng:3.3875 },
  { id:"cell-046", name:"Ketu Cell — Sabo Ikorodu", leader:"Mrs Olufunmilayo Oladipupo", phone:"08027301321", address:"7 Efunbade Asemade, Sabo, Ikorodu, Lagos", zone:"Ketu Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.6139, lng:3.5069 },
  { id:"cell-047", name:"Ketu Cell — Papa Ajao", leader:"Mrs Tope Jakpa", phone:"08036549015", address:"50 Bello Street beside Yusuf Junction, Papa Ajao, Mushin, Lagos", zone:"Ketu Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5309, lng:3.3551 },
  { id:"cell-048", name:"Ketu Cell — Ogudu", leader:"Mrs Martha Barnabas", phone:"09137812420", address:"14 Ifesowopo Street, Ogudu Orioke, Lagos", zone:"Ketu Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5813, lng:3.3928 },
  { id:"cell-049", name:"Ketu Cell — Bako Estate", leader:"Cell Leader", phone:"07060878207", address:"45 Mary Street, Bako Estate, Irawo Bus Stop, Ikorodu Road, Lagos", zone:"Ketu Zone", meetingDay:"Sunday", meetingTime:"5:00 PM", lat:6.5781, lng:3.3928 },
];

// ── Seed all 49 cells into Firestore ─────────────────────────
export async function seedCells() {
  const promises = SEED_CELLS.map(({ id, ...data }) =>
    setDoc(doc(db, CELLS_COL, id), { ...data, createdAt: serverTimestamp() })
  );
  await Promise.all(promises);
  console.log("✅ 49 Harvesters cells seeded");
}

// ── Fetch all cells ───────────────────────────────────────────
export async function getAllCells() {
  const snap = await getDocs(collection(db, CELLS_COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── User profile ──────────────────────────────────────────────
export async function createUserProfile(uid, { name, email }) {
  await setDoc(doc(db, USERS_COL, uid), {
    name, email, assignedCellId: null, createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveUserCell(uid, cellId) {
  await setDoc(doc(db, USERS_COL, uid), {
    assignedCellId: cellId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getCellById(cellId) {
  const snap = await getDoc(doc(db, CELLS_COL, cellId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
