import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';

const BoardContainer = styled.div`
  flex: 3;
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    flex: none;
    min-height: 350px;
    height: 60vh;
    margin-bottom: 20px;
  }
`;

const BoardHeader = styled.div`
  padding: 15px;
  background-color: #2c2c2c;
  border-bottom: 1px solid #444;
  
  p {
    margin: 5px 0 0;
    color: #ddd;
  }
`;

const BoardContent = styled.div`
  flex: 1;
  position: relative;
  touch-action: manipulation;
`;

const Tooltip = styled.div`
  position: absolute;
  background-color: rgba(40, 40, 40, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
  z-index: 100;
  display: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  max-width: 80%;
  
  @media (max-width: 768px) {
    font-size: 12px;
    padding: 6px 10px;
  }
`;

function GameBoard({ pubs, teams, currentTeam, onPubSelect }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  
  useEffect(() => {
    if (!pubs.length || !teams.length) return;
    
    const drawBoard = () => {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      const svg = d3.select(svgRef.current);
      
      // Clear previous drawing
      svg.selectAll("*").remove();
      
      // Adjust node size based on screen size
      const isMobile = window.innerWidth <= 768;
      const nodeRadius = isMobile ? 18 : 25;
      const fontSize = isMobile ? 7 : 8;
      
      // Create a force simulation
      const simulation = d3.forceSimulation(pubs)
        .force("link", d3.forceLink().id(d => d.id).distance(isMobile ? 80 : 100))
        .force("charge", d3.forceManyBody().strength(isMobile ? -200 : -300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(nodeRadius * 1.2));
      
      // Create links array from neighbors
      const links = [];
      pubs.forEach(pub => {
        pub.neighbors.forEach(neighborId => {
          if (pub.id < neighborId) { // Avoid duplicates
            links.push({
              source: pub.id,
              target: neighborId
            });
          }
        });
      });
      
      // Draw links
      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", isMobile ? 1.5 : 2);
      
      // Create pub nodes group
      const node = svg.append("g")
        .selectAll(".pub-node")
        .data(pubs)
        .enter()
        .append("g")
        .attr("class", "pub-node")
        .on("click", (event, d) => onPubSelect(d))
        .on("touchstart", (event, d) => {
          // Show tooltip on touch
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style("display", "block")
            .style("left", (event.touches[0].pageX + 5) + "px")
            .style("top", (event.touches[0].pageY - 40) + "px");
            
          const owner = d.owner ? teams.find(team => team.id === d.owner) : null;
          
          tooltip.html(`
            <strong>${d.name}</strong><br>
            ${owner ? `Owned by: ${owner.name}` : 'Unowned'}
          `);
          
          // Hide tooltip after a delay
          setTimeout(() => {
            tooltip.style("display", "none");
          }, 2000);
        })
        .on("mouseover", (event, d) => {
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
            
          const owner = d.owner ? teams.find(team => team.id === d.owner) : null;
          
          tooltip.html(`
            <strong>${d.name}</strong><br>
            ${owner ? `Owned by: ${owner.name}` : 'Unowned'}
          `);
        })
        .on("mouseout", () => {
          d3.select(tooltipRef.current).style("display", "none");
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      
      // Draw circles for pubs
      node.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => {
          if (d.owner) {
            const team = teams.find(team => team.id === d.owner);
            return team ? team.color : "#555";
          }
          return "#555";
        })
        .attr("stroke", d => {
          // Highlight pubs that can be attacked by current team
          if (currentTeam && d.owner !== currentTeam.id) {
            const canAttack = currentTeam.pubs.some(ownedPubId => {
              const ownedPub = pubs.find(p => p.id === ownedPubId);
              return ownedPub.neighbors.includes(d.id);
            });
            
            return canAttack ? "#FFD700" : "#222";
          }
          return "#222";
        })
        .attr("stroke-width", d => {
          // Thicker border for attackable pubs
          if (currentTeam && d.owner !== currentTeam.id) {
            const canAttack = currentTeam.pubs.some(ownedPubId => {
              const ownedPub = pubs.find(p => p.id === ownedPubId);
              return ownedPub.neighbors.includes(d.id);
            });
            
            return canAttack ? 3 : 1;
          }
          return 1;
        });
      
      // Add pub names
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", fontSize + "px")
        .attr("fill", "#fff")
        .attr("dy", 2)
        .text(d => {
          // Abbreviate pub names to fit in circles
          const words = d.name.split(' ');
          if (words.length > 1) {
            return words
              .filter(word => !['The', 'And', '&'].includes(word))
              .map(word => word.charAt(0))
              .join('');
          }
          return d.name.substring(0, 3);
        });
      
      // Update positions in simulation
      simulation.nodes(pubs).on("tick", () => {
        link
          .attr("x1", d => Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x)))
          .attr("y1", d => Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y)))
          .attr("x2", d => Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x)))
          .attr("y2", d => Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y)));
        
        node.attr("transform", d => {
          // Keep nodes within bounds
          const x = Math.max(nodeRadius, Math.min(width - nodeRadius, d.x));
          const y = Math.max(nodeRadius, Math.min(height - nodeRadius, d.y));
          return `translate(${x}, ${y})`;
        });
      });
      
      simulation.force("link").links(links);
      
      // Drag functions
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
    };
    
    drawBoard();
    
    // Redraw when window resizes
    const handleResize = () => {
      drawBoard();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pubs, teams, currentTeam, onPubSelect]);
  
  return (
    <BoardContainer>
      <BoardHeader>
        <h2>Pub Map</h2>
        {currentTeam && (
          <p>Current Turn: <strong style={{ color: currentTeam.color }}>{currentTeam.name}</strong></p>
        )}
      </BoardHeader>
      <BoardContent>
        <svg ref={svgRef} width="100%" height="100%"></svg>
        <Tooltip ref={tooltipRef}></Tooltip>
      </BoardContent>
    </BoardContainer>
  );
}

export default GameBoard; 