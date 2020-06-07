import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './styles.css';
import logo from '../../assets/logo.svg';
import { FiArrowLeft } from 'react-icons/fi';
import { Link, useHistory } from 'react-router-dom';
import { Map, Marker, TileLayer } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import DropZone from '../../components/Dropzone';
interface Item {
    id: number;
    title: string;
    image: string;
}
interface State {
    id: string;
    name: string;
}
interface City {
    id: number;
    name: string;
}
interface IbgeState {
    id: number;
    sigla: string;
    nome: string;
}
interface IbgeCity {
    id: number;
    nome: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedState, setSelectedUf] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });
    const [selectedFile, setSelectedFile] = useState<File>();
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(pos => {
            setInitialPosition([pos.coords.latitude, pos.coords.longitude]);
            setSelectedPosition(initialPosition);
        });
    }, []);
    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios.get<IbgeState[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            setStates((response.data.map(x => ({ id: x.sigla, name: x.nome } as State))));
        });
    }, []);

    useEffect(() => {
        axios.get<IbgeCity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`).then(response => {
            setCities(response.data.map(x => ({ id: x.id, name: x.nome } as City)));
        });
    }, [selectedState])

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;
        setSelectedCity(city);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value })
    }

    function handleSelectedItem(id: number) {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(x => x != id));
            return;
        }
        setSelectedItems([...selectedItems, id])
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const [latitude, longitude] = selectedPosition
        const { name, email, whatsapp } = formData;
        const city = selectedCity;
        const state = selectedState;
        const data = new FormData();
        const items = selectedItems;
        {
            data.append('name', name);
            data.append('email', email);
            data.append('whatsapp', whatsapp);
            data.append('latitude', String(latitude));
            data.append('longitude', String(longitude));
            data.append('city', city);
            data.append('state', state);
            data.append('items', items.join(','));

            if (selectedFile)
                data.append('image', selectedFile);

        }
        await api.post('points', data);
        alert('Ponto de coleta criado!')
        history.push('/');
    }

    function onMapClicked(event: LeafletMouseEvent) {

        setSelectedPosition([event.latlng.lat, event.latlng.lng])
    }

    function onFileUploaded(file: File) {
        setSelectedFile(file);
    }



    return (
        <div>
            <div id="page-create-point">
                <header>
                    <img src={logo} alt="logo" />
                    <Link to="/">
                        <FiArrowLeft />
                        Votlar para home
                    </Link>
                </header>
                <form onSubmit={handleSubmit}>
                    <h1>Cadastro do <br /> ponto de coleta</h1>
                    <DropZone onFileUploaded={onFileUploaded} />
                    <fieldset>
                        <legend>
                            <h2>Dados</h2>
                        </legend>
                        <div className="field">
                            <label htmlFor="name">Nome da entidade </label>
                            <input type="text" name="name" id="name" onChange={handleInputChange} />
                        </div>
                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="email">E-mail</label>
                                <input type="text" name="email" id="email" onChange={handleInputChange} />
                            </div>
                            <div className="field">
                                <label htmlFor="whatsapp">Whatsapp </label>
                                <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                            </div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>
                            <h2>Endereço</h2>
                            <span>selecione o endereço no Mapa</span>
                        </legend>

                        <Map center={initialPosition} zoom={15} onClick={onMapClicked}>
                            <TileLayer
                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={selectedPosition}></Marker>
                        </Map>

                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="uf">Estado (UF)</label>
                                <select name="uf" id="uf" value={selectedState} onChange={handleSelectedUf}>
                                    <option value=""> Selecione uma UF</option>
                                    {states.map(state => (
                                        <option key={state.id} title={state.name} value={state.id}>{state.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="city">Cidade </label>
                                <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity}>
                                    <option value=""> Selecione uma cidade</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.name}>{city.name}</option>
                                    ))}

                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>
                            <h2>Ítems da coleta</h2>
                        </legend>
                        <ul className="items-grid">
                            {items.map(item => (
                                <li className={selectedItems.includes(item.id) ? 'selected' : ''} key={item.id} onClick={() => handleSelectedItem(item.id)}>
                                    <img src={`http://localhost:3333/uploads/${item.image}`} alt={item.title} />
                                    <span>{item.title}</span>
                                </li>
                            ))}

                        </ul>
                    </fieldset>

                    <button type="submit">
                        Cadastrar ponto de coleta
                    </button>
                </form>
            </div>

        </div>
    );
}

export default CreatePoint;