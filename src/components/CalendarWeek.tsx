import { useEffect, useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./calendarWeek.css";


// Utility
import { getWeekDates } from '../utils/dateUtils';
// import { ActivityMap } from "../types/activityMap"; 
import { SpaceCounters } from "../types/spaceCounters";
import AnimatedCounter from './AnimatedCounter';

// Img
import imgAugusto from "../assets/img/augusto-school.png";
import imgPrato from "../assets/img/prato-scontornato.png";
import imgDelete from "../assets/img/remove.png";
import imgArrow from "../assets/img/next.png";
import imgHead from "../assets/img/photos-head.png";
import imgAtivitadeEscolar from "../assets/img/atividade-escolar.png";
import imgSaveAtivitade from "../assets/img/floppy-disk.png";
import imgSalaDeAula from "../assets/img/salaDeAula.png";
import imgAtelieCriativo from "../assets/img/atelie-criativo.jpg";
import imgAuditorio from "../assets/img/auditorio.png";
import imgQuadra from "../assets/img/quadra.png"; 
import imgSalaGoogle from "../assets/img/salaGoogle.png";
import imgBrinquedoteca from "../assets/img/brinquedoteca.png";
import imgBiblioteca from "../assets/img/biblioteca.png";
import imgAreaExterna from "../assets/img/areaExterna.png";


// Costanti
// const API_URL = "http://localhost:4000/api/weeks";
const API_URL = "https://calendar-backend-r54r.onrender.com/api/weeks"
const CURRENT_YEAR = new Date().getFullYear();
const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const timeSlots = ['07:20', '08:10', '09:00', '09:20', '10:10', '11:00', '11:50',  '13:10', '14:00', '14:50', '15:10', '16:00'];
const classes = [
  "• Infantil V A", "• Infantil V B",
  "• 1º ANO A", "• 1º ANO B", "• 1º ANO C",
  "• 2º ANO A", "• 2º ANO B", "• 2º ANO C",
  "• 3º ANO A", "• 3º ANO B",
  "• 4º ANO A", "• 4º ANO B", "• 4º ANO C",
  "• 5º ANO A", "• 5º ANO B", "• 5º ANO C",
  "GESTÃO"
];
const resources = ['TV', 'Chromebook', 'Projetor', 'Som', 'Nenhum'];

const spaceData = [
  { name: "Sala de Aula", icon: imgSalaDeAula },
  { name: "Ateliê Criativo", icon: imgAtelieCriativo },
  { name: "Auditório", icon: imgAuditorio },
  { name: "Quadra", icon: imgQuadra },
  { name: "Sala Google", icon: imgSalaGoogle },
  { name: "Brinquedoteca", icon: imgBrinquedoteca },
  { name: "Biblioteca", icon: imgBiblioteca },
  { name: "Área externa", icon: imgAreaExterna },
] as const;


// TYPE
type Space = typeof spaceData[number]['name'];
const spaces: Space[] = spaceData.map(s => s.name);
const icons: Record<Space, string> = Object.fromEntries(spaceData.map(s => [s.name, s.icon])) as Record<Space, string>;


type UserRole = 'admin' | 'docente';
type Spazio = "Sala de Aula" | "Ateliê Criativo" | "Auditório" | "Quadra" | "Sala Google" | "Brinquedoteca" | "Biblioteca" | "Área externa";
type Activity = { classe: string; risorse: string; spazio: Spazio};
type ActivityMap = {[slot: string]: Activity;};


function CalendarWeek() {
  const { weekOffset = '0' } = useParams();
  const numericOffset = parseInt(weekOffset);
  const navigate = useNavigate();
  const userRole: UserRole = 'docente';
  
  
  // useState
  const [activities, setActivities] = useState<ActivityMap>({} as ActivityMap);
  const [counters, setCounters] = useState<SpaceCounters>({} as SpaceCounters);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState<Activity>({ classe:'', risorse:'', spazio:'Sala Google' });
  const [showModal, setShowModal] = useState(false);
  const { usedClasses, usedSpaces } = getUsedAtHour(activities, selectedSlot);

  // stato alert
  const [alert, setAlert] = useState<{type: "success" | "danger" | "warning", message: string} | null>(null);

  // Caricamento dati settimana e contatori
  useEffect(() => {
    const fetchData = async () => {
      try {
        const weekRes = await axios.get<ActivityMap>(`${API_URL}/${numericOffset}`);
        console.log("Attività ricevute:", weekRes.data);
        setActivities(weekRes.data || {});
      } catch (error) {
        console.warn("Settimana non trovata o errore:", error);
        setActivities({} as ActivityMap);
      }

      try {
        const countersRes = await axios.get<SpaceCounters>(`${API_URL}/counters/${CURRENT_YEAR}`);
        setCounters(countersRes.data || {});
      } catch (error) {
        console.error("Errore nel caricamento dei contatori:", error);
      }
    };

    fetchData();
  }, [numericOffset]);

  
  //HandleCellClick
   const handleCellClick = (slot: string) => {
    // if (userRole === 'docente') return;
    setSelectedSlot(slot);
    const existing = activities[slot];
    setFormData(existing || { classe: '', risorse: '', spazio: '' });
    setShowModal(true);
  };
  
  
  //handleConfirm
  const handleConfirm = () => {
    if (!selectedSlot) return;
    // const oldAct = activities[selectedSlot];
    const [day, time] = selectedSlot.split('-');
    const newAct = { ...formData };
    
    const sameTimeSlots = Object.entries(activities)
      .filter(([key]) => key.startsWith(`${day}-${time}`) && key !== selectedSlot);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isDuplicate = sameTimeSlots.some(([_, act]) =>
      act.classe === newAct.classe ||
      act.risorse === newAct.risorse ||
      act.spazio === newAct.spazio
    );

    if (isDuplicate) {
      setAlert({ type: "danger", message: "Classe, risorsa o spazio già assegnati a quest’ora." });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const oldAct = activities[selectedSlot];
    
    //update counter
    setCounters(prev => {
      const next = { ...prev };
      if (oldAct && oldAct.spazio !== newAct.spazio) {
        // Decrementa lo spazio vecchio
        next[oldAct.spazio] = Math.max((next[oldAct.spazio] || 1) - 1, 0);
        // Incrementa lo spazio nuovo
        next[newAct.spazio] = (next[newAct.spazio]||0) +1;
      } else if (!oldAct) {
        // Nuova prenotazione: incrementa il nuovo spazio
        next[newAct.spazio] = (next[newAct.spazio]||0) +1;
      }
      return next;
    });
    // Salva la nuova attività nello slot selezionato
    setActivities(prev => ({ ...prev, [selectedSlot]: newAct }));
    // Chiudi la modale
    setShowModal(false);
  };
  
  
  //handleDelete
  const handleDelete = (slot: string) => {
    const oldAct = activities[slot];
    if (!oldAct) return;
    setCounters(prev => ({
      ...prev,
      [oldAct.spazio]: Math.max((prev[oldAct.spazio]||1) -1, 0)
    }));
    setActivities(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };
  
  //handleSave
    const handleSave = async () => {
      if (!activities || Object.keys(activities).length === 0) {
       setAlert({ type: "warning", message: " Nenhuma atividade salva" });
      setTimeout(() => setAlert(null), 5000);
      return;
    }
    try {
      await axios.post(`${API_URL}/${numericOffset}`, { activities });
      setAlert({ type: "success", message: "Dados salvos com sucesso!" });
      setTimeout(() => setAlert(null), 5000);
      await axios.post(`${API_URL}/counters/${CURRENT_YEAR}`, counters);
    } catch(err) {
      console.error("Errore nel salvataggio:", err);
       setAlert({ type: "danger", message: "Errore durante il salvataggio." });

      setTimeout(() => setAlert(null), 3000);
      // alert("Errore durante il salvataggio.");
    }
  };

  const { start, end } = getWeekDates(numericOffset);
  const MAX_WEEK = 51, MIN_WEEK = 0;
  
  useEffect(() => {
    if (numericOffset < MIN_WEEK || numericOffset > MAX_WEEK) {
      navigate(`/settimana/${Math.min(Math.max(numericOffset, MIN_WEEK), MAX_WEEK)}`);
    }
  }, [numericOffset, navigate]);
  
  
  // Funzione helper per calcolare classi e spazi occupati a un'ora (escludendo selectedSlot)
  function getUsedAtHour(activities: ActivityMap, selectedSlot: string | null): { usedClasses: Set<string>, usedSpaces: Set<string> } {
    if (!selectedSlot)
      return { usedClasses: new Set(), usedSpaces: new Set() };

    const selectedHour = selectedSlot.split('-')[1]; // estrae l'ora es. '07:20'

    const usedClasses = new Set<string>();
    const usedSpaces = new Set<string>();

    for (const [key, activity] of Object.entries(activities)) {
      if (key.endsWith(`-${selectedHour}`) && key !== selectedSlot && activity) {
        usedClasses.add(activity.classe);
        usedSpaces.add(activity.spazio);
      }
    }
    return { usedClasses, usedSpaces };
  }

  
  return (
    <div className="container">
      <div>
        <img style={{ maxWidth: "100%", width:420, marginTop: -50}} src={imgHead} alt="head" />
      </div>
      <div className='betania-patmos-regular'>
        Escola Municipal<br />Augusto Dos Anjos
      </div>
        <div className='fredericka-the-great-regular'>Atividades Escolares</div>
        <div className='augusto-prato'>
          <img className='img-augusto' src={imgAugusto} alt="augusto" />
          <div style={{marginTop: -150}}>
          <img className="img-prato" src={imgPrato} alt="prato" />
        </div> 
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3" style={{marginTop:450}}>
        <img src={imgArrow} alt="precendente" className='buttonWeekLeft' onClick={() => navigate(`/settimana/${numericOffset-1}`)} />
        <h5 className="ojuju-semana-skip">Semana <strong style={{color:"red"}}>de</strong> {start} <strong style={{color:"red"}}>a</strong> {end}</h5>
        <img src={imgArrow} alt="successivo" className='buttonWeekRight' onClick={() => navigate(`/settimana/${numericOffset+1}`)} />
      </div>

      <div className="table-responsive"  style={{marginTop:40 }}>
        <table className="table table-bordered text-center align-middle" style={{ minWidth: '800px' }}>
          <thead>
            <tr style={{border:0}}>
              <th style={{ backgroundColor: '	#4682b4', color: 'white', borderRadius: 30 }}>Horário</th>
              {daysOfWeek.map((day) =>
                <th key={day} style={{ backgroundColor: '#90ee90', color: 'white', borderRadius: 30 }} >{day}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
            <tr style={{ border: 0 }} key={time}>
              <th className='verticalTextHour' style={{ backgroundColor: '	#4682b4', color: 'white', borderRadius:50, fontSize: 20 }} rowSpan={1}>
                {time}
              </th>
              {daysOfWeek.map((day) => (
              <td key={`${day}-${time}`} style={{ padding: 30}}>
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map((i) => {
                const key = `${day}-${time}-${i}`;
                const activity = activities[key];
                return (
                  <div key={key} style={{
                    cursor: 'pointer', height: '85px', width: "200px", position: 'relative',
                    border: '3px solid #f8f8ff', borderRadius: 6, padding: 4,
                    backgroundColor: activity ? '#fff0f0' : '#f0fff0',
                    }}
                    onClick={() => handleCellClick(key)}
                  >
                {/* Etichetta slot 1/4, 2/4... */}
                <div style={{
                  position: "absolute", top: "5px", right: "8px", fontSize: "0.65rem", color: "#999"
                  }}>
                  {i}/3
                </div>

                {activity ? (
                  <>
                    <div style={{
                      position: "absolute", top: "5px", left: "5px", width: "10px", height: "10px",
                      borderRadius: "50%", backgroundColor: "red"
                    }}></div>
                    <div className="fw-bold">{activity.classe}</div>
                    <div>{activity.risorse}</div>
                    <div>{activity.spazio}</div>
                    {userRole === 'docente' && (
                      <Button variant="" size="sm" className="position-absolute bottom-0 end-0 m-0"
                        onClick={e => { e.stopPropagation(); handleDelete(key); }}>
                        <img src={imgDelete} alt="delete" style={{ height: 30 }} />
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className='slot'
                      style={{
                        position: "absolute",
                        top: "5px",
                        left: "5px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "green",
                        boxShadow: "0 0 0 rgba(0, 255, 0, 0.7)",
                        animation: "pulse 2s infinite"
                      }} >
                      <style>
                        {`
                          @keyframes pulse {
                            0% {
                              box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7);
                            }
                            70% {
                              box-shadow: 0 0 0 10px rgba(0, 255, 0, 0);
                            }
                            100% {
                              box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
                            }
                          }
                        `}
                      </style>
                    </div>
                          <div className='position-livre rotating'>
                          <strong className='quicksand-adicionar-atividade'>+ Adicionar atividade</strong>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </td>
    ))}
  </tr>
))}
          </tbody>
          <thead>
            <tr style={{ border: 0 }}>
              <th style={{ backgroundColor: '	#4682b4', color: 'white', borderRadius:50, fontSize: 15 }}>Horário</th>
              {daysOfWeek.map((day) => <th style={{ backgroundColor: '#90ee90', color: 'white', borderRadius: 30 }} key={day}>{day}
              </th>)}
            </tr>
          </thead>
        </table>
      </div>
      
      <div className="img-save-ativitade mt-3 text-end">
        <img
          className="img-save"
          style={{ marginTop: 20, width: 100 }}
          src={imgSaveAtivitade}
          alt="save-ativitade"
          onClick={handleSave}
        />
        {/* Alert dinamico */}
        {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mt-3`} role="alert">
          {alert.message}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}
      </div>

      <div className="mt-5">
        <h6 className='graduate-regular' style={{ textTransform: 'uppercase' }}>
          Contador de uso dos espaços <br /> 2026
        </h6>
        <ul className="list-group mt-4">
          {(Object.keys(counters) as Spazio[]).map((space) => (
            <li key={space} className="list-contador-espacos" style={{ fontFamily: 'Allan'}}>
              <div className="d-flex align-items-center gap-2 tektur-card-espaco">
                <img src={icons[space]} alt={space} style={{ width: 100, height: 80,borderRadius: 30 }}/>
                <span style={{fontSize: 24}}>{space}</span>
              </div>
              <span className='tektur-card-espaco' style={{ fontSize: '2.0rem' }}> <AnimatedCounter value={counters[space] || 0} /></span>
            </li>
          ))}
        </ul>
        <footer className="text-center mt-5 mb-3 text-muted" style={{ fontSize: '0.9rem' }}>
          ©{new Date().getFullYear()} Created by Francesco Rapisarda<br /><strong>All rights reserved.</strong>
        </footer>
      </div>
      
      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Agendar atividade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img className='ativitade-escolar' src={imgAtivitadeEscolar} alt="img-agendar-ativitade" />
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Turma</Form.Label>
              <Form.Select
                value={formData.classe}
                onChange={e => setFormData({ ...formData, classe: e.target.value })}
              >
                <option value=""> Selecione uma turma</option>
                {classes.map(c =>
                  <option key={c} value={c} disabled={usedClasses.has(c)}>
                    {c} {usedClasses.has(c) ? ' (ocupada)' : ''}
                  </option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Recurso</Form.Label>
              <Form.Select value={formData.risorse}
                onChange={e => setFormData({ ...formData, risorse: e.target.value })}>
                <option value="">Selecione um recurso</option>
                {resources.map(r =>
                  <option
                    key={r} value={r}>{r}
                  </option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Espaço</Form.Label>
              <Form.Select
                className='select-espaco'
                value={formData.spazio}
                onChange={(e) => setFormData({ ...formData, spazio: e.target.value as Spazio })}
              >
                <option value="">Ambientes de Aprendizagem</option>
                {spaces.map(s => (
                  <option key={s} value={s} disabled={usedSpaces.has(s)}>
                    {s} {usedSpaces.has(s) ? ' (ocupado)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!formData.classe || !formData.risorse || !formData.spazio}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarWeek;
